'use client';

/**
 * AnalyticsCharts Component
 * Displays complaint analytics charts by product, region, and category
 * Requirements: 5.1
 */

import React from 'react';
import { ComplaintCategory, getCategoryDisplayName } from '@/types/complaint';

interface ProductData {
  productId: string;
  productName: string;
  count: number;
}

interface RegionData {
  region: string;
  count: number;
}

interface CategoryData {
  category: ComplaintCategory;
  count: number;
}

interface AnalyticsChartsProps {
  byProduct: ProductData[];
  byRegion: RegionData[];
  byCategory: CategoryData[];
  isLoading?: boolean;
}

/**
 * Get color for chart bar based on index
 */
function getBarColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  return colors[index % colors.length];
}

/**
 * Get category color based on category type
 */
function getCategoryColor(category: ComplaintCategory): string {
  const categoryColors: Record<ComplaintCategory, string> = {
    damaged_product: 'bg-red-500',
    wrong_item: 'bg-orange-500',
    missing_item: 'bg-yellow-500',
    quality_issue: 'bg-purple-500',
    delivery_problem: 'bg-blue-500',
    other: 'bg-gray-500',
  };
  return categoryColors[category];
}

/**
 * Horizontal Bar Chart Component
 */
function HorizontalBarChart({
  data,
  getLabel,
  getColor,
  maxValue,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  getLabel: (item: { label: string; value: number }) => string;
  getColor: (item: { label: string; value: number }, index: number) => string;
  maxValue: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-slate-300 truncate max-w-[200px]">
                {getLabel(item)}
              </span>
              <span className="text-gray-500 dark:text-slate-400 font-medium">
                {item.value}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getColor(item, index)} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Loading Skeleton for charts
 */
function ChartSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-8 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * AnalyticsCharts - Displays complaint distribution charts
 * 
 * Features:
 * - Complaints by product chart (Requirements: 5.1)
 * - Complaints by region chart (Requirements: 5.1)
 * - Complaints by category chart (Requirements: 5.1)
 */
export default function AnalyticsCharts({
  byProduct,
  byRegion,
  byCategory,
  isLoading = false,
}: AnalyticsChartsProps) {
  // Calculate max values for scaling
  const maxProductCount = Math.max(...byProduct.map((p) => p.count), 1);
  const maxRegionCount = Math.max(...byRegion.map((r) => r.count), 1);
  const maxCategoryCount = Math.max(...byCategory.map((c) => c.count), 1);

  // Transform data for charts
  const productChartData = byProduct.slice(0, 10).map((item, index) => ({
    label: item.productId,
    value: item.count,
    color: getBarColor(index),
    productName: item.productName,
  }));

  const regionChartData = byRegion.slice(0, 10).map((item, index) => ({
    label: item.region,
    value: item.count,
    color: getBarColor(index),
  }));

  const categoryChartData = byCategory.map((item) => ({
    label: item.category,
    value: item.count,
    color: getCategoryColor(item.category),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Complaints by Product - Requirements: 5.1 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Complaints by Product
        </h3>
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <HorizontalBarChart
            data={productChartData}
            getLabel={(item) => {
              const product = productChartData.find((p) => p.label === item.label);
              return product?.productName || item.label;
            }}
            getColor={(_, index) => getBarColor(index)}
            maxValue={maxProductCount}
          />
        )}
      </div>

      {/* Complaints by Region - Requirements: 5.1 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Complaints by Region
        </h3>
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <HorizontalBarChart
            data={regionChartData}
            getLabel={(item) => item.label}
            getColor={(_, index) => getBarColor(index)}
            maxValue={maxRegionCount}
          />
        )}
      </div>

      {/* Complaints by Category - Requirements: 5.1 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Complaints by Category
        </h3>
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <HorizontalBarChart
            data={categoryChartData}
            getLabel={(item) => getCategoryDisplayName(item.label as ComplaintCategory)}
            getColor={(item) => getCategoryColor(item.label as ComplaintCategory)}
            maxValue={maxCategoryCount}
          />
        )}
      </div>
    </div>
  );
}

export { AnalyticsCharts };
