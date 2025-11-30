import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ARPU Future Rise Life Foundation',
    short_name: 'ARPU Foundation',
    description: 'Supporting communities through education, healthcare, and sustainable development programs across India.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['social', 'nonprofit', 'charity'],

    icons: [
      {
        src: '/ARPUICON.ico',
        sizes: '48x48',
        type: 'image/x-icon',
        purpose: 'any'
      },
      {
        src: '/ARPUICON.ico',
        sizes: '192x192',
        type: 'image/x-icon',
        purpose: 'any'
      },
      {
        src: '/ARPUICON.ico',
        sizes: '512x512',
        type: 'image/x-icon',
        purpose: 'any'
      },
      {
        src: '/ARPUICON.ico',
        sizes: '192x192',
        type: 'image/x-icon',
        purpose: 'maskable'
      }
    ],

    shortcuts: [
      {
        name: 'Donate Now',
        short_name: 'Donate',
        description: 'Make a donation to support our programs',
        url: '/donate',
        icons: [
          {
            src: '/ARPUICON.ico',
            sizes: '96x96',
            type: 'image/x-icon'
          }
        ]
      },
      {
        name: 'Our Programs',
        short_name: 'Programs',
        description: 'View our education and healthcare programs',
        url: '/programs',
        icons: [
          {
            src: '/ARPUICON.ico',
            sizes: '96x96',
            type: 'image/x-icon'
          }
        ]
      },
      {
        name: 'Contact Us',
        short_name: 'Contact',
        description: 'Get in touch with our team',
        url: '/contact',
        icons: [
          {
            src: '/ARPUICON.ico',
            sizes: '96x96',
            type: 'image/x-icon'
          }
        ]
      }
    ],

    screenshots: [
      {
        src: '/ARPUICON.ico',
        sizes: '1280x720',
        type: 'image/x-icon',
        form_factor: 'wide',
        label: 'Homepage on desktop'
      },
      {
        src: '/ARPUICON.ico',
        sizes: '390x844',
        type: 'image/x-icon',
        form_factor: 'narrow',
        label: 'Homepage on mobile'
      }
    ],

    related_applications: [],
    prefer_related_applications: false,

    // PWA features
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui']
  }
}