'use client';

/**
 * RecentOrdersWidget Component
 * Displays the 5 most recent orders using the same business columns
 * as the main Orders table.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import WidgetContainer from '../WidgetContainer';
import StatusBadge from '@/components/ui/StatusBadge';
import AIScoreColumn from '@/components/orders/AIScoreColumn';
import api from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/lib/formatCurrency';
import { canDisplayOrderAI } from '@/lib/orderStatus';

export interface RecentOrdersWidgetProps {
  /** Maximum number of recent orders to display */
  maxOrders?: number;
  /** Optional class name for styling */
  className?: string;
}


/**
 * Clean imported product names before displaying them.
 */
function cleanProductName(name?: string): string {
  if (!name || name.trim().toLowerCase() === 'null') {
    return 'Produit sans nom';
  }

  return name
    .replace(
      /\s*\(?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\)?/gi,
      ''
    )
    .replace(/\s+x\s*\d+\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Empty state component
 */
function EmptyState({
  t,
}: {
  t: (key: TranslationKey) => string;
}): JSX.Element {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="recent-orders-empty"
    >
      <div className="mb-4 rounded-full bg-slate-500/10 p-3">
        <ShoppingBagIcon className="h-8 w-8 text-slate-400" />
      </div>

      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.recentOrders.empty')}
      </p>
    </div>
  );
}

/**
 * Limit orders to the configured maximum.
 */
export function getDisplayOrders(
  orders: Order[],
  maxOrders: number
): Order[] {
  return orders.slice(0, Math.min(maxOrders, orders.length));
}

export function RecentOrdersWidget({
  maxOrders = 5,
  className = '',
}: RecentOrdersWidgetProps): JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/orders/recent?limit=${maxOrders}`
      );

      if (response.data?.orders) {
        setOrders(response.data.orders);
      } else if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('widget.recentOrders.empty');

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxOrders]);

  const displayOrders = getDisplayOrders(orders, maxOrders);


  return (
    <WidgetContainer
      title={t('widget.recentOrders')}
      icon={<ShoppingBagIcon className="h-5 w-5 text-[#32CD32]" />}
      isLoading={isLoading}
      error={error ?? undefined}
      onRetry={fetchOrders}
      className={className}
    >
      {displayOrders.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div
          data-testid="recent-orders-table"
          className="relative"
        >
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white/70 shadow-[0_6px_22px_rgba(15,23,42,0.035)] dark:border-slate-700/80 dark:bg-slate-900/50">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-gradient-to-r from-[#ADFF2F]/[0.07] via-white to-[#00BFFF]/[0.07] dark:from-[#ADFF2F]/[0.035] dark:via-slate-900 dark:to-[#00BFFF]/[0.035]">
                <tr className="border-b border-slate-200/90 dark:border-slate-700">
                  <th className="whitespace-nowrap px-2 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.075em] text-slate-500 dark:text-slate-400">
                    {t('orders.orderId')}
                  </th>

                  <th className="px-2 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.075em] text-slate-500 dark:text-slate-400">
                    {t('orders.products')}
                  </th>

                  <th className="px-2 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.075em] text-slate-500 dark:text-slate-400">
                    {t('orders.customer')}
                  </th>

                  <th className="whitespace-nowrap px-2 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.075em] text-slate-500 dark:text-slate-400">
                    {t('orders.phone')}
                  </th>

                  <th className="whitespace-nowrap px-2 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.075em] text-slate-500 dark:text-slate-400">
                    {t('orders.status')}
                  </th>

                  <th className="whitespace-nowrap px-2 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.075em] text-slate-500 dark:text-slate-400">
                    {t('orders.aiScore')}
                  </th>

                  <th className="whitespace-nowrap px-2 py-3.5 text-right text-[11px] font-extrabold uppercase tracking-[0.075em] text-slate-500 dark:text-slate-400">
                    {t('orders.value')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-slate-100 transition-all duration-200 last:border-b-0 hover:bg-gradient-to-r hover:from-[#ADFF2F]/[0.04] hover:via-transparent hover:to-[#00BFFF]/[0.04] dark:border-slate-800 dark:hover:from-[#ADFF2F]/[0.025] dark:hover:to-[#00BFFF]/[0.025]"
                    data-testid="recent-order-row"
                  >
                    {/* ID */}
                    <td className="whitespace-nowrap px-2 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {order.confirmedId
                          ? `#${order.confirmedId}`
                          : '—'}
                      </span>
                    </td>

                    {/* Produit */}
                    <td className="px-2 py-3">
                      <div className="w-[220px] space-y-2">
                        {order.items?.length ? (
                          order.items.map((item, index) => {
                            const quantity =
                              Number.isFinite(item.quantity) &&
                              item.quantity > 0
                                ? item.quantity
                                : 1;

                            const populatedProduct =
                              typeof item.productId === 'object'
                                ? item.productId
                                : null;

                            const imageUrl =
                              populatedProduct?.imageUrl;

                            const productName =
                              cleanProductName(
                                item.name ||
                                  populatedProduct?.name
                              );

                            const productKey =
                              typeof item.productId === 'string'
                                ? item.productId
                                : item.productId?._id ||
                                  `product-${index}`;

                            return (
                              <div
                                key={`${productKey}-${index}`}
                                className="flex items-center gap-3"
                                title={productName}
                              >
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm ring-1 ring-black/[0.02] dark:border-slate-700 dark:bg-slate-800 dark:ring-white/[0.03]">
                                  {imageUrl ? (
                                    <Image
                                      src={imageUrl}
                                      alt={productName}
                                      width={40}
                                      height={40}
                                      className="h-full w-full object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-300">
                                      <Package
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-gray-700 dark:text-slate-300">
                                    {productName}
                                  </div>

                                  <div className="text-xs text-gray-500 dark:text-slate-400">
                                    ×{quantity}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-gray-500 dark:text-slate-400">
                            —
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-2 py-3">
                      <span className="block max-w-[150px] truncate font-medium text-gray-700 dark:text-slate-300">
                        {order.clientInfo?.name ||
                          t('widget.unknownCustomer')}
                      </span>
                    </td>

                    {/* Téléphone */}
                    <td className="whitespace-nowrap px-2 py-3 text-gray-600 dark:text-slate-400">
                      {order.clientInfo?.phone || '—'}
                    </td>

                    {/* Statut */}
                    <td className="whitespace-nowrap px-2 py-3">
                      <StatusBadge
                        status={order.status}
                        size="sm"
                      />
                    </td>

                    {/* Score IA */}
                    <td className="px-2 py-3">
                      {canDisplayOrderAI(order.status) &&
                      typeof order.aiScore === 'number' ? (
                        <AIScoreColumn
                          score={order.aiScore}
                          showDetails={false}
                          size="sm"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-400 dark:text-slate-500">
                          —
                        </span>
                      )}
                    </td>

                    {/* Valeur */}
                    <td className="whitespace-nowrap px-2 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(
                        order.totalAmount ?? 0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end border-t border-slate-200/80 pt-3 dark:border-slate-800">
            <Link
              href="/panel/client/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-[#ADFF2F]/30 bg-gradient-to-r from-[#ADFF2F]/10 to-[#00BFFF]/[0.06] px-3.5 py-2 text-sm font-bold text-green-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ADFF2F]/60 hover:shadow-md dark:text-[#ADFF2F]"
            >
              {t('widget.recentOrders.viewAll')} →
            </Link>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default RecentOrdersWidget;
