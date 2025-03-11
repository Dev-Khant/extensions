import { Detail, Clipboard, List, ActionPanel, Action, Form } from "@raycast/api";
import { useEffect, useState } from "react";
import fetch from "node-fetch";

interface MemoryResult {
  memory: string;
  event: string;
}

interface ApiResponse {
  results?: MemoryResult[];
}

export default function Command() {
  const [clipboardText, setClipboardText] = useState<string>("");
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function getClipboardContent() {
      const text = await Clipboard.readText();
      if (text) {
        setClipboardText(text);
      } else {
        setClipboardText("Clipboard is empty");
      }
      setIsLoading(false);
    }
    getClipboardContent();
  }, []);

  async function handleAddMemory(text: string) {
    setIsLoading(true);
    try {
      const response = await fetch("https://api.mem0.ai/v1/memories/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Token m0-aU76vlvUJccJMUaeZP7Li1KPZ68XTd72zDb65FZY"
        },
        body: JSON.stringify({
          messages: [{ 
            role: "user", 
            content: text 
          }],
          user_id: "raycast",
          output_format: "v1.1"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as ApiResponse;
      setResults(data.results || []);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to store in Mem0:", error);
    }
    setIsLoading(false);
  }

  if (isEditing) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm 
              title="Save to Mem0" 
              onSubmit={(values: { text: string }) => handleAddMemory(values.text)}
            />
            <Action 
              title="Cancel" 
              onAction={() => setIsEditing(false)}
              shortcut={{ modifiers: ["cmd"], key: "escape" }}
            />
          </ActionPanel>
        }
      >
        <Form.TextArea
          id="text"
          title="Memory Text"
          defaultValue={clipboardText}
          enableMarkdown
        />
      </Form>
    );
  }

  return (
    <List isLoading={isLoading}>
      <List.Section title="Original Text">
        <List.Item 
          title={clipboardText}
          actions={
            <ActionPanel>
              <Action 
                title="Add to Mem0" 
                onAction={() => handleAddMemory(clipboardText)}
              />
              <Action
                title="Edit Text"
                onAction={() => setIsEditing(true)}
                shortcut={{ modifiers: ["cmd"], key: "e" }}
              />
            </ActionPanel>
          }
        />
      </List.Section>
      <List.Section title="Extracted Memories">
        {results.map((result, index) => (
          <List.Item
            key={index}
            title={result.memory}
            accessories={[{ text: result.event }]}
          />
        ))}
      </List.Section>
    </List>
  );
}
