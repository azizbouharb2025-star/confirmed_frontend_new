'use client'

import React, { useMemo, useState } from 'react'

import colissimoDeliveryService, {
  type ColissimoCapabilities,
  type ColissimoDispatchPreview,
  type ColissimoDispatchResult,
  type ColissimoOptions,
  type ColissimoPreviewItem,
  type ColissimoPreviewResult,
} from '@/services/colissimoDeliveryService'

interface ColissimoApiPanelProps {
  orderIds: string[]
  onBusyChange?: (busy: boolean) => void
}

function getApiErrorData(err: unknown) {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err
  ) {
    return (
      err as {
        response?: {
          data?: {
            error?: string
            liveDispatchDisabled?: boolean
            liveDispatchNotAllowed?: boolean
            shipmentState?: string
            remoteCreated?: boolean
            externalId?: string | null
          }
        }
      }
    ).response?.data
  }

  return null
}

export default function ColissimoApiPanel({
  orderIds,
  onBusyChange,
}: ColissimoApiPanelProps) {
  const [typeColis, setTypeColis] =
    useState<1 | 2 | 3>(1)

  const [ouvrir, setOuvrir] =
    useState(false)

  const [fragile, setFragile] =
    useState(false)

  const [capabilities, setCapabilities] =
    useState<ColissimoCapabilities | null>(null)

  const [preview, setPreview] =
    useState<ColissimoPreviewResult | null>(null)

  const [reservationId, setReservationId] =
    useState<string | null>(null)

  const [finalPreview, setFinalPreview] =
    useState<ColissimoDispatchPreview | null>(null)

  const [showConfirmation, setShowConfirmation] =
    useState(false)

  const [dispatchResult, setDispatchResult] =
    useState<ColissimoDispatchResult | null>(null)

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null)

  const [successMsg, setSuccessMsg] =
    useState<string | null>(null)

  const [busy, setBusy] =
    useState(false)

  const setBusyState = (value: boolean) => {
    setBusy(value)
    onBusyChange?.(value)
  }

  const options: ColissimoOptions = {
    typeColis,
    ouvrir,
    fragile,
  }

  const allPreviewItems =
    useMemo(
      () =>
        Array.isArray(preview?.items)
          ? preview.items
          : [],
      [preview]
    )

  const readyItems =
    allPreviewItems.filter(
      item =>
        item.status === 'READY'
    )

  const reviewItems =
    allPreviewItems.filter(
      item =>
        item.status === 'REVIEW'
    )

  const invalidItems =
    allPreviewItems.filter(
      item =>
        item.status === 'INVALID'
    )

  const liveEnabled =
    capabilities?.liveDispatchEnabled === true

  const finalItem =
    finalPreview?.wouldPost?.[0]

  const resetPreparation = () => {
    setReservationId(null)
    setFinalPreview(null)
    setShowConfirmation(false)
    setDispatchResult(null)
  }

  const handleOptionsChanged = () => {
    setPreview(null)
    setCapabilities(null)
    resetPreparation()
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handlePreview = async () => {
    if (orderIds.length === 0) {
      setErrorMsg(
        'Sélectionnez au moins une commande avant l’analyse Colissimo.'
      )
      return
    }

    setBusyState(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    setPreview(null)
    resetPreparation()

    try {
      const caps =
        await colissimoDeliveryService.getCapabilities()

      setCapabilities(caps)

      const result =
        await colissimoDeliveryService.previewOrders(
          orderIds,
          options
        )

      setPreview(result)
    } catch (err) {
      const apiError =
        getApiErrorData(err)

      setErrorMsg(
        apiError?.error ||
        (
          err instanceof Error
            ? err.message
            : 'Erreur lors de l’analyse Colissimo.'
        )
      )
    } finally {
      setBusyState(false)
    }
  }

  const prepareReservation = async (
    allowReview: boolean
  ) => {
    if (orderIds.length !== 1) {
      setErrorMsg(
        'La préparation API Colissimo est limitée à une seule commande.'
      )
      return
    }

    setBusyState(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    resetPreparation()

    try {
      const reservation =
        await colissimoDeliveryService.reserveOrders(
          orderIds,
          options,
          allowReview
        )

      let activeReservationId =
        reservation.reservationId

      /*
       * Si une préparation existe déjà,
       * on tente uniquement de la reprendre.
       * Aucun appel Colissimo distant ici.
       */
      if (!activeReservationId) {
        const active =
          await colissimoDeliveryService.getActiveReservation(
            orderIds[0]
          )

        activeReservationId =
          active.reservationId
      }

      if (!activeReservationId) {
        throw new Error(
          'La réservation locale Colissimo n’a pas pu être créée.'
        )
      }

      const checked =
        await colissimoDeliveryService.previewReservation(
          activeReservationId
        )

      if (
        checked.summary?.wouldPost !== 1 ||
        (checked.summary?.invalid || 0) !== 0 ||
        !checked.wouldPost?.[0]?.correlationId ||
        !checked.wouldPost?.[0]?.payloadHash
      ) {
        throw new Error(
          'Le contrôle final Colissimo nécessite une nouvelle vérification.'
        )
      }

      setReservationId(
        activeReservationId
      )

      setFinalPreview(checked)

      setSuccessMsg(
        'Réservation locale créée et contrôle final réussi. Aucun colis Colissimo n’a été créé.'
      )
    } catch (err) {
      const apiError =
        getApiErrorData(err)

      setErrorMsg(
        apiError?.error ||
        (
          err instanceof Error
            ? err.message
            : 'Erreur lors de la préparation Colissimo.'
        )
      )
    } finally {
      setBusyState(false)
    }
  }

  const handleDispatch = async () => {
    if (!liveEnabled) {
      setErrorMsg(
        'L’envoi réel Colissimo est désactivé par le serveur.'
      )
      return
    }

    if (!reservationId) {
      setErrorMsg(
        'La réservation Colissimo est introuvable.'
      )
      return
    }

    setBusyState(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      /*
       * Le verrou serveur est revérifié
       * juste avant tout appel LIVE.
       */
      const caps =
        await colissimoDeliveryService.getCapabilities()

      setCapabilities(caps)

      if (!caps.liveDispatchEnabled) {
        throw new Error(
          'L’envoi réel Colissimo vient d’être désactivé par le serveur.'
        )
      }

      /*
       * Recalcul complet du payload/hash.
       */
      const freshPreview =
        await colissimoDeliveryService.previewReservation(
          reservationId
        )

      const item =
        freshPreview.wouldPost?.[0]

      if (
        freshPreview.summary?.wouldPost !== 1 ||
        (freshPreview.summary?.invalid || 0) !== 0 ||
        !item?.correlationId ||
        !item?.payloadHash
      ) {
        throw new Error(
          'Le contrôle final Colissimo n’est plus valide.'
        )
      }

      if (
        freshPreview.reservationExpiresAt &&
        new Date(
          freshPreview.reservationExpiresAt
        ).getTime() <= Date.now()
      ) {
        throw new Error(
          'La réservation Colissimo a expiré.'
        )
      }

      setFinalPreview(freshPreview)

      const result =
        await colissimoDeliveryService.dispatchReservation({
          reservationId,

          expectedCorrelationId:
            item.correlationId,

          expectedPayloadHash:
            item.payloadHash,
        })

      if (
        result.success !== true ||
        !result.externalId
      ) {
        throw new Error(
          'Réponse Colissimo inattendue après création.'
        )
      }

      setDispatchResult(result)
      setReservationId(null)
      setShowConfirmation(false)

      setSuccessMsg(
        `Colis Colissimo créé avec succès. N° de suivi : ${result.externalId}`
      )
    } catch (err) {
      const apiError =
        getApiErrorData(err)

      if (
        apiError?.remoteCreated === true ||
        apiError?.shipmentState ===
          'reconcile_required'
      ) {
        setReservationId(null)
        setShowConfirmation(false)

        setErrorMsg(
          apiError.externalId
            ? `Colissimo a créé le colis ${apiError.externalId}, mais Confirmed nécessite une réconciliation. Ne renvoyez pas cette commande.`
            : 'Le résultat Colissimo est incertain. Une réconciliation est nécessaire. Ne relancez pas l’envoi.'
        )

        return
      }

      if (
        apiError?.liveDispatchDisabled
      ) {
        setCapabilities(current =>
          current
            ? {
                ...current,
                liveDispatchEnabled:
                  false,
              }
            : current
        )

        setShowConfirmation(false)

        setErrorMsg(
          'L’envoi réel Colissimo est désactivé par le serveur.'
        )

        return
      }

      if (
        apiError?.liveDispatchNotAllowed
      ) {
        setErrorMsg(
          'Cette commande n’est pas autorisée dans l’allowlist Colissimo.'
        )
        return
      }

      setErrorMsg(
        apiError?.error ||
        (
          err instanceof Error
            ? err.message
            : 'Erreur lors de l’envoi Colissimo.'
        )
      )
    } finally {
      setBusyState(false)
    }
  }

  const renderPreviewItem = (
    item: ColissimoPreviewItem,
    status: 'READY' | 'REVIEW' | 'INVALID',
    index: number
  ) => {
    const styles = {
      READY:
        'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400',

      REVIEW:
        'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',

      INVALID:
        'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400',
    }

    const labels = {
      READY: 'Prête',
      REVIEW: 'À vérifier',
      INVALID: 'Invalide',
    }

    return (
      <div
        key={
          item.orderId ||
          `${status}-${index}`
        }
        className={`rounded-lg border p-3 text-sm ${styles[status]}`}
      >
        <div className="flex justify-between gap-3">
          <span className="font-semibold">
            Commande #{item.confirmedId ?? '—'}
          </span>

          <span>
            {labels[status]}
          </span>
        </div>

        {[...(item.warnings || []), ...(item.errors || [])]
          .map((message, i) => (
            <p
              key={`${message}-${i}`}
              className="mt-1 text-xs"
            >
              • {message}
            </p>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
          Connexion API Colissimo
        </p>

        <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80">
          Confirmed vérifie le colis avant toute création chez Colissimo.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {successMsg}
        </div>
      )}

      {!dispatchResult && (
        <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-slate-700">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Type de colis
            </label>

            <select
              value={typeColis}
              disabled={busy}
              onChange={event => {
                setTypeColis(
                  Number(
                    event.target.value
                  ) as 1 | 2 | 3
                )
                handleOptionsChanged()
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value={1}>
                Petit
              </option>

              <option value={2}>
                Moyen
              </option>

              <option value={3}>
                Grand
              </option>
            </select>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-slate-700">
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                Ouverture du colis
              </span>

              <span className="text-xs text-gray-500 dark:text-slate-400">
                Autoriser l&apos;ouverture à la livraison
              </span>
            </span>

            <input
              type="checkbox"
              checked={ouvrir}
              disabled={busy}
              onChange={event => {
                setOuvrir(
                  event.target.checked
                )
                handleOptionsChanged()
              }}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-slate-700">
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                Fragile
              </span>

              <span className="text-xs text-gray-500 dark:text-slate-400">
                Signaler le colis comme fragile
              </span>
            </span>

            <input
              type="checkbox"
              checked={fragile}
              disabled={busy}
              onChange={event => {
                setFragile(
                  event.target.checked
                )
                handleOptionsChanged()
              }}
              className="h-4 w-4"
            />
          </label>

          <button
            type="button"
            onClick={handlePreview}
            disabled={
              busy ||
              orderIds.length === 0
            }
            className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? 'Analyse en cours…'
              : 'Analyser pour Colissimo'}
          </button>

          {orderIds.length !== 1 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              L&apos;analyse peut couvrir plusieurs commandes, mais la préparation API et l&apos;envoi réel sont limités à une seule commande.
            </p>
          )}
        </div>
      )}

      {preview && !dispatchResult && (
        <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Résultat de l&apos;analyse Colissimo
            </h3>

            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {preview.selected ?? allPreviewItems.length}
              {' '}commande(s) analysée(s)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-green-500/10 p-3 text-green-600 dark:text-green-400">
              <p className="text-xs font-semibold">
                Prêtes
              </p>

              <p className="mt-1 text-xl font-bold">
                {preview.ready ?? readyItems.length}
              </p>
            </div>

            <div className="rounded-lg bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
              <p className="text-xs font-semibold">
                À vérifier
              </p>

              <p className="mt-1 text-xl font-bold">
                {preview.review ?? reviewItems.length}
              </p>
            </div>

            <div className="rounded-lg bg-red-500/10 p-3 text-red-600 dark:text-red-400">
              <p className="text-xs font-semibold">
                Invalides
              </p>

              <p className="mt-1 text-xl font-bold">
                {preview.invalid ?? invalidItems.length}
              </p>
            </div>
          </div>

          {readyItems.map(
            (item, index) =>
              renderPreviewItem(
                item,
                'READY',
                index
              )
          )}

          {reviewItems.map(
            (item, index) =>
              renderPreviewItem(
                item,
                'REVIEW',
                index
              )
          )}

          {invalidItems.map(
            (item, index) =>
              renderPreviewItem(
                item,
                'INVALID',
                index
              )
          )}

          {orderIds.length === 1 &&
            !finalPreview &&
            invalidItems.length === 0 &&
            (
              readyItems.length === 1 ||
              reviewItems.length === 1
            ) && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  prepareReservation(
                    reviewItems.length === 1
                  )
                }
                className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy
                  ? 'Préparation en cours…'
                  : reviewItems.length === 1
                    ? 'Valider et préparer le colis'
                    : 'Préparer le colis'}
              </button>
            )}
        </div>
      )}

      {finalPreview &&
        finalItem &&
        !dispatchResult && (
          <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-slate-700">
            <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              ✓ Réservation locale active
              <br />
              ✓ Payload Colissimo contrôlé
              <br />
              ✓ Hash SHA-256 généré
              <br />
              ✓ Aucun colis distant créé
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="mb-3 text-sm font-semibold text-blue-700 dark:text-blue-400">
                Prêt pour Colissimo
              </p>

              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-slate-400">
                    Commande
                  </dt>

                  <dd className="font-semibold text-gray-900 dark:text-white">
                    #{finalItem.confirmedId ?? '—'}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-slate-400">
                    Référence
                  </dt>

                  <dd className="font-medium text-gray-900 dark:text-white">
                    {finalItem.correlationId || '—'}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-slate-400">
                    Destination
                  </dt>

                  <dd className="text-right font-medium text-gray-900 dark:text-white">
                    {finalItem.destination?.governorate || '—'}
                    {' / '}
                    {finalItem.destination?.city || '—'}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-slate-400">
                    Articles
                  </dt>

                  <dd className="font-medium text-gray-900 dark:text-white">
                    {finalItem.parcel?.articleCount ?? '—'}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-slate-400">
                    Montant
                  </dt>

                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {finalItem.amount ?? '—'} DT
                  </dd>
                </div>
              </dl>

              {finalPreview.reservationExpiresAt && (
                <p className="mt-3 border-t border-blue-500/10 pt-3 text-[11px] text-gray-500 dark:text-slate-400">
                  Réservation temporaire jusqu&apos;à{' '}
                  {new Date(
                    finalPreview.reservationExpiresAt
                  ).toLocaleString()}
                </p>
              )}
            </div>

            <div
              className={[
                'rounded-lg border p-3',

                liveEnabled
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-red-500/20 bg-red-500/5',
              ].join(' ')}
            >
              <p
                className={[
                  'text-xs font-semibold',

                  liveEnabled
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400',
                ].join(' ')}
              >
                {liveEnabled
                  ? 'Envoi réel autorisé par le serveur'
                  : 'Envoi réel vers Colissimo désactivé par le serveur'}
              </p>

              <p className="mt-1 text-[11px] text-gray-600 dark:text-slate-400">
                {liveEnabled
                  ? 'Une confirmation finale reste obligatoire.'
                  : 'Confirmed bloque actuellement toute création réelle de colis Colissimo.'}
              </p>

              <button
                type="button"
                disabled={
                  !liveEnabled ||
                  busy
                }
                onClick={() =>
                  setShowConfirmation(true)
                }
                className={[
                  'mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold',

                  liveEnabled && !busy
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'cursor-not-allowed bg-gray-300 text-gray-500 opacity-70 dark:bg-slate-700 dark:text-slate-400',
                ].join(' ')}
              >
                {liveEnabled
                  ? 'Continuer vers la confirmation'
                  : 'Confirmer l’envoi — désactivé'}
              </button>
            </div>

            {showConfirmation && (
              <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Confirmation finale
                </p>

                <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">
                  Cette action créera réellement le colis chez Colissimo.
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setShowConfirmation(false)
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 dark:border-slate-600 dark:text-white"
                  >
                    Retour
                  </button>

                  <button
                    type="button"
                    disabled={
                      busy ||
                      !liveEnabled
                    }
                    onClick={handleDispatch}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy
                      ? 'Envoi en cours…'
                      : 'Confirmer l’envoi réel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {dispatchResult && (
        <div className="space-y-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            Colis Colissimo créé
          </p>

          <p className="text-sm text-gray-700 dark:text-slate-200">
            N° de suivi :{' '}
            <span className="font-mono font-semibold">
              {dispatchResult.externalId}
            </span>
          </p>

          {dispatchResult.labelUrl && (
            <a
              href={dispatchResult.labelUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-sm font-medium text-blue-600 underline dark:text-blue-400"
            >
              Ouvrir le bordereau
            </a>
          )}

          {dispatchResult.zebraLabelUrl && (
            <a
              href={dispatchResult.zebraLabelUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-sm font-medium text-blue-600 underline dark:text-blue-400"
            >
              Ouvrir le bordereau Zebra
            </a>
          )}

          <p className="text-xs text-gray-500 dark:text-slate-400">
            Le suivi automatique Colissimo sera activé lorsque l&apos;API de tracking sera documentée.
          </p>
        </div>
      )}
    </div>
  )
}
