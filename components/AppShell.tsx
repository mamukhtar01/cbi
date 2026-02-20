'use client';

import { useState } from 'react';
import { Layout, Menu, Button, Typography, Dropdown } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  BankOutlined,
  AlertOutlined,
  FileTextOutlined,
  SyncOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/beneficiaries', icon: <TeamOutlined />, label: 'Beneficiaries' },
  { key: '/payments', icon: <DollarOutlined />, label: 'Payments' },
  { key: '/budget-lines', icon: <BankOutlined />, label: 'Budget Lines' },
  { key: '/alerts', icon: <AlertOutlined />, label: 'Alerts' },
  { key: '/audit-logs', icon: <FileTextOutlined />, label: 'Audit Logs' },
  { key: '/reconciliation', icon: <SyncOutlined />, label: 'Reconciliation' },
];

interface AppShellProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function AppShell({ children, session }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: () => signOut({ callbackUrl: '/login' }),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {!collapsed && (
            <Title level={5} style={{ color: 'white', margin: 0 }}>
              CBI Disbursement
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              {session?.user?.name ?? session?.user?.email ?? 'User'}
            </Button>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
