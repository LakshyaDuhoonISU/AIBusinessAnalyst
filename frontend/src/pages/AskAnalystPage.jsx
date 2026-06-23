/**
 * Ask Analyst Page
 * 
 * Chat-like interface where users can ask natural language
 * business questions about their data. Also supports
 * auto-generating insights.
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Input, Button, Card, Spin, message, Tag } from 'antd';
import {
  SendOutlined, BulbOutlined, ThunderboltOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import API from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AskAnalystPage = () => {
  const { projectId } = useParams();
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);

  // Suggested questions for quick access
  const suggestedQuestions = [
    'Why did revenue decrease?',
    'Which product is underperforming?',
    'Which region generates the highest profit?',
    'What are the biggest risks?',
    'How can revenue be improved?',
    'What trends should management monitor?',
  ];

  const handleAsk = async (q = question) => {
    if (!q.trim()) return;

    const userQuestion = q.trim();
    setQuestion('');
    setLoading(true);

    // Add user message immediately
    setConversations((prev) => [
      ...prev,
      { type: 'question', content: userQuestion, timestamp: new Date() },
    ]);

    try {
      const response = await API.post(`/projects/${projectId}/ask`, {
        question: userQuestion,
      });

      // Add AI response
      setConversations((prev) => [
        ...prev,
        {
          type: 'answer',
          content: response.data.data.answer,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      message.error('Failed to get answer. Make sure a dataset is uploaded.');
      // Remove the question if failed
      setConversations((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setInsightLoading(true);
    try {
      const response = await API.post(`/projects/${projectId}/generate-insights`);

      setConversations((prev) => [
        ...prev,
        {
          type: 'insight',
          content: response.data.data.insights,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      message.error('Failed to generate insights');
    } finally {
      setInsightLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            🤖 Ask Business Analyst
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
            Ask questions about your data in plain English
          </Text>
        </div>

        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={insightLoading}
          onClick={handleGenerateInsights}
          id="generate-insights-btn"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            height: '42px',
          }}
        >
          Auto-Generate Insights
        </Button>
      </div>

      {/* Conversation Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '16px',
          paddingRight: '8px',
        }}
      >
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>💬</div>
            <Title level={4} style={{ color: 'rgba(255,255,255,0.4)' }}>
              Start a conversation
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '24px' }}>
              Ask any business question about your uploaded data
            </Text>

            {/* Suggested Questions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
              {suggestedQuestions.map((sq, idx) => (
                <Tag
                  key={idx}
                  onClick={() => handleAsk(sq)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    background: 'rgba(102, 126, 234, 0.08)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    color: '#667eea',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                >
                  <QuestionCircleOutlined style={{ marginRight: '4px' }} />
                  {sq}
                </Tag>
              ))}
            </div>
          </div>
        ) : (
          conversations.map((conv, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: conv.type === 'question' ? 'flex-end' : 'flex-start',
              }}
            >
              <Card
                style={{
                  maxWidth: conv.type === 'question' ? '60%' : '85%',
                  borderRadius: '14px',
                  background: conv.type === 'question'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : conv.type === 'insight'
                    ? 'rgba(240, 147, 251, 0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: conv.type === 'question'
                    ? 'none'
                    : conv.type === 'insight'
                    ? '1px solid rgba(240, 147, 251, 0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
                size="small"
              >
                {conv.type === 'question' ? (
                  <Text style={{ color: '#fff' }}>{conv.content}</Text>
                ) : (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <Tag
                        color={conv.type === 'insight' ? 'magenta' : 'purple'}
                        style={{ borderRadius: '6px' }}
                      >
                        {conv.type === 'insight' ? (
                          <><BulbOutlined /> Auto Insights</>
                        ) : (
                          '🤖 AI Analyst'
                        )}
                      </Tag>
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {conv.content}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <Card
              style={{
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              size="small"
            >
              <Spin size="small" style={{ marginRight: '8px' }} />
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                Analyzing your data...
              </Text>
            </Card>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <TextArea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your data..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          id="analyst-question-input"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#fff',
            resize: 'none',
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleAsk()}
          loading={loading}
          disabled={!question.trim()}
          id="analyst-send-btn"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '10px',
            height: 'auto',
            minWidth: '50px',
          }}
        />
      </div>
    </div>
  );
};

export default AskAnalystPage;
