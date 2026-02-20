'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Typography,
  Tag,
  Space,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import PageWrapper from '@/components/PageWrapper';

const { Title } = Typography;

interface Beneficiary {
  id: string;
  name: string;
  phone: string;
  address?: string;
  status: string;
  createdAt: string;
}

function BeneficiariesContent() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  const fetchBeneficiaries = async () => {
    setLoading(true);
    const res = await fetch('/api/beneficiaries');
    const data = await res.json();
    setBeneficiaries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleSubmit = async (values: { name: string; phone: string; address?: string }) => {
    const url = editingId
      ? `/api/beneficiaries/${editingId}`
      : '/api/beneficiaries';
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
      fetchBeneficiaries();
    } else {
      const err = await res.json();
      message.error(err.error ?? 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/beneficiaries/${id}`, { method: 'DELETE' });
    if (res.ok) {
      message.success('Deleted');
      fetchBeneficiaries();
    }
  };

  const handleEdit = (record: Beneficiary) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleUpload = async () => {
    if (!fileList[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileList[0] as unknown as File);

    const res = await fetch('/api/beneficiaries/upload', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    setUploading(false);

    if (res.ok) {
      message.success(
        `Uploaded: ${result.created} created, ${result.skipped} skipped, ${result.errors.length} errors`
      );
      setUploadModalOpen(false);
      setFileList([]);
      fetchBeneficiaries();
    } else {
      message.error('Upload failed');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'ACTIVE' ? 'green' : 'red'}>{s}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Beneficiary) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete beneficiary?"
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
          Beneficiaries
        </Title>
        <Space>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Add Beneficiary
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={beneficiaries}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingId ? 'Edit Beneficiary' : 'Add Beneficiary'}
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
            name="phone"
            label="Phone (E.164)"
            rules={[{ required: true }]}
          >
            <Input placeholder="+25070000000" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Upload Beneficiaries Excel"
        open={uploadModalOpen}
        onCancel={() => {
          setUploadModalOpen(false);
          setFileList([]);
        }}
        onOk={handleUpload}
        okText="Upload"
        confirmLoading={uploading}
      >
        <Upload
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList([file]);
            return false;
          }}
          onRemove={() => setFileList([])}
          accept=".xlsx,.xls,.csv"
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
        <p style={{ marginTop: 8, color: '#666' }}>
          Excel file must have columns: name, phone (E.164), address (optional)
        </p>
      </Modal>
    </div>
  );
}

export default function BeneficiariesPage() {
  return (
    <PageWrapper>
      <BeneficiariesContent />
    </PageWrapper>
  );
}
