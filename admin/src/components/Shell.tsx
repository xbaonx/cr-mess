"use client";
import React from 'react';
import { Layout, Menu, Input } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminToken } from '../lib/useAdminToken';
import { AppstoreOutlined, UserOutlined, SettingOutlined, DatabaseOutlined, DeploymentUnitOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, setToken } = useAdminToken();

  const items = [
    { key: '/', icon: <AppstoreOutlined />, label: 'Dashboard' },
    { key: '/users', icon: <UserOutlined />, label: 'Users' },
    { key: '/features', icon: <SettingOutlined />, label: 'Features' },
    { key: '/tokens', icon: <DatabaseOutlined />, label: 'Tokens' },
    { key: '/referral', icon: <DeploymentUnitOutlined />, label: 'Referral' },
  ];

  const activeKey = items.find(i => pathname === i.key)?.key || items.find(i => pathname.startsWith(i.key) && i.key !== '/')?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth={64}>
        <div style={{ color: '#fff', padding: '12px 16px', fontWeight: 700 }}>F-wallet Admin</div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={items} onClick={(e) => router.push(e.key)} />
      </Sider>
      <Layout>
        <Header style={{ background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#ddd' }}>x-admin-token:</div>
          <Input.Password size="small" value={token} onChange={(e) => setToken(e.target.value)} placeholder="admin token" style={{ maxWidth: 360 }} />
        </Header>
        <Content style={{ padding: 16 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
