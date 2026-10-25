import { Alert, Button, Input, Progress, Space, Spin, Tag, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { LangDraft } from './narrationDraft';

interface NarrationEditorProps {
  draft: LangDraft;
  onTextChange: (text: string) => void;
  onPickFile: (file: File) => void;
  onClearFile: () => void;
  onSave: () => void;
  onRetryLoad: () => void;
  onRetrySave: () => void;
}

/**
 * Nội dung của một tab ngôn ngữ (PRD 7.1.5): ô văn bản, ô chọn file .mp3,
 * trình nghe thử audio hiện có, thanh tiến độ khi tải file và nút "Lưu".
 */
export function NarrationEditor({
  draft,
  onTextChange,
  onPickFile,
  onClearFile,
  onSave,
  onRetryLoad,
  onRetrySave,
}: NarrationEditorProps) {
  return (
    <Spin spinning={draft.loading} description="Đang tải nội dung...">
      <div className="admin-narration">
        {draft.loadError !== null && (
          <Alert
            type="error"
            showIcon
            title={draft.loadError}
            action={
              <Button size="small" onClick={onRetryLoad}>
                Thử lại
              </Button>
            }
          />
        )}

        <div className="admin-field">
          <Typography.Text strong>Văn bản thuyết minh</Typography.Text>
          <Input.TextArea
            value={draft.text}
            onChange={(event) => onTextChange(event.target.value)}
            rows={10}
            placeholder="Nhập bài thuyết minh cho ngôn ngữ này..."
            status={draft.textError !== null ? 'error' : undefined}
            disabled={draft.saving}
          />
          {draft.textError !== null && (
            <span className="admin-field-error">{draft.textError}</span>
          )}
        </div>

        <div className="admin-field">
          <Typography.Text strong>File audio (.mp3, tối đa 10 MB)</Typography.Text>
          <Space wrap>
            <Upload
              accept=".mp3,audio/mpeg"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                onPickFile(file);
                // Tự gửi file khi bấm "Lưu" (API08), không để Upload tự tải lên.
                return Upload.LIST_IGNORE;
              }}
              disabled={draft.saving}
            >
              <Button icon={<UploadOutlined />} disabled={draft.saving}>
                Chọn file .mp3
              </Button>
            </Upload>

            {draft.file !== null && (
              <>
                <Tag color="blue">{draft.file.name}</Tag>
                <Button type="link" size="small" onClick={onClearFile} disabled={draft.saving}>
                  Bỏ chọn
                </Button>
              </>
            )}
          </Space>
          {draft.fileError !== null && (
            <span className="admin-field-error">{draft.fileError}</span>
          )}
        </div>

        {draft.audioUrl !== null && (
          <div className="admin-field">
            <Typography.Text strong>Nghe thử audio hiện có</Typography.Text>
            <audio
              key={draft.audioVersion}
              className="admin-audio"
              controls
              src={`${draft.audioUrl}?v=${draft.audioVersion}`}
            />
          </div>
        )}

        {draft.saving && (
          <Progress
            percent={draft.progress}
            status="active"
            format={(percent) => `Đang tải lên ${percent ?? 0}%`}
          />
        )}

        {draft.saveError !== null && (
          <Alert
            type="error"
            showIcon
            title={draft.saveError}
            action={
              <Button size="small" onClick={onRetrySave}>
                Thử lại
              </Button>
            }
          />
        )}

        <Space wrap>
          <Button type="primary" onClick={onSave} loading={draft.saving} disabled={draft.saving}>
            Lưu
          </Button>
          {draft.hasContent && (
            <Typography.Text type="secondary">
              Ngôn ngữ này đã có nội dung, lưu sẽ ghi đè.
            </Typography.Text>
          )}
        </Space>
      </div>
    </Spin>
  );
}
