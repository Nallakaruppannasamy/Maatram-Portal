import logo from './maatram_logo.png'

export interface BrandAssets {
  logo: string
  brandName: string
  tagline: string
}

export const assets: BrandAssets = {
  logo,
  brandName: 'MAATRAM',
  tagline: 'Volunteering Portal',
} as const

export { logo }
export default assets