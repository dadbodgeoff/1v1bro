/**
 * Analytics utility functions for calculations and data transformations
 */

export interface DeviceBreakdown {
  mobile: number
  tablet: number
  desktop: number
}

export interface DevicePercentages {
  mobile: number
  tablet: number
  desktop: number
  total: number
}

/**
 * Calculates device breakdown percentages that sum to 100%
 * Property 1: Device breakdown percentages sum to 100%
 * 
 * @param devices - Raw device counts
 * @returns Percentages for each device type
 */
export function calculateDevicePercentages(devices: DeviceBreakdown): DevicePercentages {
  const total = devices.mobile + devices.tablet + devices.desktop
  
  if (total === 0) {
    return { mobile: 0, tablet: 0, desktop: 0, total: 0 }
  }
  
  // Calculate raw percentages
  const mobileRaw = (devices.mobile / total) * 100
  const tabletRaw = (devices.tablet / total) * 100
  const desktopRaw = (devices.desktop / total) * 100
  
  // Round to 1 decimal place
  let mobile = Math.round(mobileRaw * 10) / 10
  let tablet = Math.round(tabletRaw * 10) / 10
  let desktop = Math.round(desktopRaw * 10) / 10
  
  // Adjust for rounding errors to ensure sum is exactly 100%
  const sum = mobile + tablet + desktop
  if (sum !== 100 && total > 0) {
    // Find the largest value and adjust it
    const diff = 100 - sum
    if (desktop >= mobile && desktop >= tablet) {
      desktop = Math.round((desktop + diff) * 10) / 10
    } else if (mobile >= tablet) {
      mobile = Math.round((mobile + diff) * 10) / 10
    } else {
      tablet = Math.round((tablet + diff) * 10) / 10
    }
  }
  
  return { mobile, tablet, desktop, total }
}

/**
 * Calculates funnel conversion rate between two steps
 * Property 4: Funnel conversion rates are correctly calculated
 * 
 * @param currentCount - Count at current step
 * @param previousCount - Count at previous step
 * @returns Conversion rate as percentage
 */
export function calculateFunnelConversionRate(currentCount: number, previousCount: number): number {
  if (previousCount === 0) return 0
  return (currentCount / previousCount) * 100
}

/**
 * Calculates funnel drop-off percentage
 * Property 5: Funnel drop-off is inverse of conversion
 * 
 * @param conversionRate - Conversion rate as percentage
 * @returns Drop-off rate as percentage
 */
export function calculateFunnelDropOff(conversionRate: number): number {
  return 100 - conversionRate
}

/**
 * Calculates campaign conversion rate
 * Property 16: Campaign conversion rate calculation
 * 
 * @param conversions - Number of conversions
 * @param visitors - Number of visitors
 * @returns Conversion rate as percentage
 */
export function calculateCampaignConversionRate(conversions: number, visitors: number): number {
  if (visitors === 0) return 0
  return (conversions / visitors) * 100
}
