// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '../context/AppContext';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const { user, token } = useApp();
  const router = useRouter();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!token || !user) {
      router.push('/auth');
    }
  }, [token, user, router]);

  if (!token || !user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Kazi Mashinani - Dashboard</title>
        <meta name="description" content="Kazi Mashinani - Connecting Rural Talent with Opportunities" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      <Dashboard />
    </>
  );
}
