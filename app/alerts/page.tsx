'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import PageWrapper from '@/components/PageWrapper';

const { Title } = Typography;

interface AlertItem {
  id: string;
  type: string;
  message: string;
  paymentId?: string;
  resolved: boolean;
  createdAt: string;
}

function AlertsContent() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    const res = await fetch('/api/alerts');
    setAlerts(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const resolve = async (id: string) => {
    const res = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved: true }),
    });
    if (res.ok) {
      message.success('Alert resolved');
      fetchAlerts();
    }
  };

  const typeColors: Record<string, string> = {
    FAILED: 'red',
    DELAYED: 'orange',
    DUPLICATE: 'purple',
    OVER_DISBURSEMENT: 'volcano',
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => (
        <Tag color={typeColors[t] ?? 'default'}>{t}</Tag>
      ),
    },
    { title: 'Message', dataIndex: 'message', key: 'message' },
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      render: (v?: string) => v ?? '-',
    },
    {
      title: 'Status',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? 'Resolved' : 'Open'}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: AlertItem) =>
        !record.resolved ? (
          <Button
            icon={<CheckOutlined />}
            size="small"
            type="primary"
            onClick={() => resolve(record.id)}
          >
            Resolve
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        Alerts
      </Title>
      <Table
        columns={columns}
        dataSource={alerts}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
}

export default function AlertsPage() {
  return (
    <PageWrapper>
      <AlertsContent />
    </PageWrapper>
  );
}
