import '../styles/globals.css'
import Layout from '../components/Layout'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>)

  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(13, 20, 36, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            padding: '14px 18px',
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#06090f',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#06090f',
            },
          },
        }}
      />
    </>
  )
}
