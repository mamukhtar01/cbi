'use client';

import { useEffect, useState } from 'react';
import { Table, Typography, Tag } from 'antd';
import PageWrapper from '@/components/PageWrapper';

const { Title } = Typography;

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  details?: string;
  createdAt: string;
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (a: string) => <Tag color="blue">{a}</Tag>,
    },
    { title: 'Entity', dataIndex: 'entity', key: 'entity' },
    {
      title: 'Entity ID',
      dataIndex: 'entityId',
      key: 'entityId',
      render: (v?: string) => v ?? '-',
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      render: (v?: string) => v ?? '-',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (v?: string) => v ?? '-',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleString(),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        Audit Logs
      </Title>
      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <PageWrapper>
      <AuditLogsContent />
    </PageWrapper>
  );
}
