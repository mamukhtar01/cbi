'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Typography,
  Progress,
  Space,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageWrapper from '@/components/PageWrapper';

const { Title } = Typography;

interface BudgetLine {
  id: string;
  name: string;
  totalAmount: number;
  usedAmount: number;
  createdAt: string;
}

function BudgetLinesContent() {
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchLines = async () => {
    setLoading(true);
    const res = await fetch('/api/budget-lines');
    setLines(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchLines();
  }, []);

  const handleSubmit = async (values: { name: string; totalAmount: number }) => {
    const url = editingId
      ? `/api/budget-lines/${editingId}`
      : '/api/budget-lines';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      message.success(editingId ? 'Updated' : 'Created');
      setModalOpen(false);
      form.resetFields();
      setEditingId(null);
      fetchLines();
    } else {
      const err = await res.json();
      message.error(err.error ?? 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/budget-lines/${id}`, { method: 'DELETE' });
    if (res.ok) {
      message.success('Deleted');
      fetchLines();
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `$${v.toLocaleString()}`,
    },
    {
      title: 'Used',
      dataIndex: 'usedAmount',
      key: 'usedAmount',
      render: (v: number) => `$${v.toLocaleString()}`,
    },
    {
      title: 'Remaining',
      key: 'remaining',
      render: (r: BudgetLine) =>
        `$${(r.totalAmount - r.usedAmount).toLocaleString()}`,
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (r: BudgetLine) => (
        <Progress
          percent={Math.round((r.usedAmount / r.totalAmount) * 100)}
          size="small"
          status={
            r.usedAmount >= r.totalAmount
              ? 'exception'
              : r.usedAmount / r.totalAmount > 0.8
              ? 'active'
              : 'normal'
          }
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: BudgetLine) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingId(record.id);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete budget line?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Budget Lines
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Add Budget Line
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={lines}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingId ? 'Edit Budget Line' : 'Add Budget Line'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingId(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="totalAmount"
            label="Total Amount"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function BudgetLinesPage() {
  return (
    <PageWrapper>
      <BudgetLinesContent />
    </PageWrapper>
  );
}
