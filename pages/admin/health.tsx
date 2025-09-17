import dynamic from 'next/dynamic';

export default dynamic(() => import('@/components/admin/pages/HealthClient'), { ssr: false });
