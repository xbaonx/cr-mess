import dynamic from 'next/dynamic';

export default dynamic(() => import('@/components/admin/pages/UsersClient'), { ssr: false });
