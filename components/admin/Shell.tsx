"use client";
import React from 'react';
import { Layout, Menu, Input } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAdminToken } from '@/lib/admin/useAdminToken';
import { AppstoreOutlined, UserOutlined, SettingOutlined, DatabaseOutlined, DeploymentUnitOutlined, BarChartOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, setToken } = useAdminToken();

  const items = [
    { key: '/admin', icon: <AppstoreOutlined />, label: <Link href="/admin">Dashboard</Link> },
    { key: '/admin/health', icon: <BarChartOutlined />, label: <Link href="/admin/health">Health</Link> },
    { key: '/admin/users', icon: <UserOutlined />, label: <Link href="/admin/users">Users</Link> },
    { key: '/admin/features', icon: <SettingOutlined />, label: <Link href="/admin/features">Features</Link> },
    { key: '/admin/tokens', icon: <DatabaseOutlined />, label: <Link href="/admin/tokens">Tokens</Link> },
    { key: '/admin/referral', icon: <DeploymentUnitOutlined />, label: <Link href="/admin/referral">Referral</Link> },
  ];

  // Determine active key by longest matching prefix
  const activeKey = items
    .map(i => i.key)
    .sort((a, b) => b.length - a.length)
    .find(k => router.pathname.startsWith(k)) || '/admin';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth={64}>
        <div style={{ color: '#fff', padding: '12px 16px', fontWeight: 700 }}>F-wallet Admin</div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={items as any} />
      </Sider>
      <Layout>
        <Header style={{ background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#ddd' }}>x-admin-token:</div>
          <Input.Password
            size="small"
            value={token}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
            placeholder="admin token"
            style={{ maxWidth: 360 }}
          />
        </Header>
        <Content style={{ padding: 16 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
