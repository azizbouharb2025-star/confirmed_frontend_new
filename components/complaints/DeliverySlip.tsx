'use client';

/**
 * DeliverySlip Component
 * Printable delivery slip with QR code and support/complaint message
 */

import React, { useRef, useCallback } from 'react';
import { SupportCard } from '@/types/complaint';
import { Order } from '@/types/order';
import { useLanguage } from '@/hooks/useLanguage';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface DeliverySlipProps {
  supportCard: SupportCard;
  order?: Order | null;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DeliverySlip({ supportCard, order, onClose }: DeliverySlipProps): JSX.Element {
  const { t } = useLanguage();
  const slipRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const content = slipRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('deliverySlip.title')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
          .slip { max-width: 600px; margin: 0 auto; border: 2px dashed #cbd5e1; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
          .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          .header p { font-size: 12px; color: #64748b; }
          .order-info { margin-bottom: 20px; }
          .order-info table { width: 100%; font-size: 13px; }
          .order-info td { padding: 4px 8px; }
          .order-info td:first-child { font-weight: 600; width: 140px; color: #475569; }
          .items { margin-bottom: 20px; }
          .items h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .items table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .items th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 600; }
          .items td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
          .qr-section { text-align: center; margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
          .qr-section img { width: 160px; height: 160px; margin: 0 auto 12px; display: block; }
          .qr-section .scan-msg { font-size: 13px; font-weight: 600; color: #1e40af; }
          .qr-section .scan-desc { font-size: 11px; color: #64748b; margin-top: 4px; }
          .support-msg { text-align: center; padding: 16px; background: #eff6ff; border-radius: 8px; margin-top: 16px; }
          .support-msg p { font-size: 12px; color: #1e40af; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #94a3b8; }
          @media print { body { padding: 0; } .slip { border: none; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [t]);

  const displayId = supportCard.orderNumber || supportCard.orderId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('deliverySlip.preview')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <PrinterIcon className="w-4 h-4" />
              {t('deliverySlip.print')}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label={t('orderDetail.close')}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable slip content */}
        <div className="p-6">
          <div ref={slipRef}>
            <div className="slip" style={{ maxWidth: 600, margin: '0 auto', border: '2px dashed #cbd5e1', padding: 32 }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1a1a1a' }}>
                  {t('deliverySlip.title')}
                </h1>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  {t('deliverySlip.subtitle')}
                </p>
              </div>

              {/* Order info */}
              <div style={{ marginBottom: 20 }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', fontWeight: 600, width: 140, color: '#475569' }}>
                        {t('deliverySlip.orderId')}
                      </td>
                      <td style={{ padding: '4px 8px', color: '#1a1a1a' }}>{displayId}</td>
                    </tr>
                    {order && (
                      <>
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: 600, width: 140, color: '#475569' }}>
                            {t('deliverySlip.customer')}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#1a1a1a' }}>{order.clientInfo.name}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: 600, width: 140, color: '#475569' }}>
                            {t('deliverySlip.phone')}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#1a1a1a' }}>{order.clientInfo.phone}</td>
                        </tr>
                        {order.deliveryInfo?.address && (
                          <tr>
                            <td style={{ padding: '4px 8px', fontWeight: 600, width: 140, color: '#475569' }}>
                              {t('deliverySlip.address')}
                            </td>
                            <td style={{ padding: '4px 8px', color: '#1a1a1a' }}>
                              {[order.deliveryInfo.address.street, order.deliveryInfo.address.city, order.deliveryInfo.address.state].filter(Boolean).join(', ')}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: 600, width: 140, color: '#475569' }}>
                            {t('deliverySlip.date')}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#1a1a1a' }}>{formatDate(order.createdAt)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Items table */}
              {order && order.items.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>
                    {t('deliverySlip.items')}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#f1f5f9', padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>
                          {t('deliverySlip.itemName')}
                        </th>
                        <th style={{ background: '#f1f5f9', padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>
                          {t('deliverySlip.qty')}
                        </th>
                        <th style={{ background: '#f1f5f9', padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#1a1a1a' }}>
                          {t('deliverySlip.price')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#1a1a1a' }}>{item.name}</td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#1a1a1a' }}>{item.quantity}</td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#1a1a1a' }}>{item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={2} style={{ padding: '8px', fontWeight: 700, textAlign: 'right', color: '#1a1a1a' }}>
                          {t('deliverySlip.total')}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700, textAlign: 'right', color: '#1a1a1a' }}>
                          {order.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* QR Code section */}
              <div style={{ textAlign: 'center', margin: '24px 0', padding: 20, background: '#f8fafc', borderRadius: 8 }}>
                {supportCard.qrCodeBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={supportCard.qrCodeBase64}
                    alt={`QR Code for order ${displayId}`}
                    style={{ width: 160, height: 160, margin: '0 auto 12px', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: 160, height: 160, margin: '0 auto 12px', background: '#e2e8f0', borderRadius: 8 }} />
                )}
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                  {t('deliverySlip.scanMessage')}
                </p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  {t('deliverySlip.scanDescription')}
                </p>
              </div>

              {/* Support message */}
              <div style={{ textAlign: 'center', padding: 16, background: '#eff6ff', borderRadius: 8, marginTop: 16 }}>
                <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                  {t('deliverySlip.supportMessage')}
                </p>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: '#94a3b8' }}>
                <p>{t('deliverySlip.footer')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliverySlip;
