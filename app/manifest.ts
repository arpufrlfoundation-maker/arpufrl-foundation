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
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
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
            src: '/icons/donate-icon.png',
            sizes: '96x96',
            type: 'image/png'
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
            src: '/icons/programs-icon.png',
            sizes: '96x96',
            type: 'image/png'
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
            src: '/icons/contact-icon.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      }
    ],

    screenshots: [
      {
        src: '/screenshots/desktop-home.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Homepage on desktop'
      },
      {
        src: '/screenshots/mobile-home.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Homepage on mobile'
      }
    ],

    related_applications: [],
    prefer_related_applications: false,

    // PWA features
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    edge_side_panel: {
      preferred_width: 400
    }
  }
}