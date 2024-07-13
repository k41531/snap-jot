import { List, ActionPanel, Action, getPreferenceValues, Detail, Icon, showToast, Toast } from "@raycast/api";
import fs from "node:fs";
import path from "node:path";
import { useState, useEffect } from "react";

interface Preferences {
  directory: string;
}

interface FileContent {
  name: string;
  path: string;
  content: string;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const folderPath = preferences.directory;
  const [files, setFiles] = useState<FileContent[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const readFiles = () => {
      try {
        const fileNames = fs.readdirSync(folderPath);
        const fileContents = fileNames.map((fileName) => {
          const filePath = path.join(folderPath, fileName);
          const content = fs.readFileSync(filePath, "utf-8");
          return { name: fileName, path: filePath, content };
        });
        setFiles(fileContents);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to read directory",
          message: (error as Error).message,
        });
      }
    };

    readFiles();
  }, [folderPath]);

  const filteredFiles = files.filter((file) =>
    file.content.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <List searchBarPlaceholder="Search Memos" onSearchTextChange={setSearchText} throttle={true}>
      {filteredFiles.map((file) => (
        <List.Item
          key={file.path}
          title={file.name}
          subtitle={getMatchingContent(file.content, searchText)}
          actions={
            <ActionPanel>
              <Action.Push title="View Content" icon={Icon.ChevronRight} target={<ShowNote file={file} searchText={searchText} />} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function ShowNote({ file, searchText }: { file: FileContent; searchText: string }) {
  const bulletPoints = file.content
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .reverse();

  const filteredBulletPoints = bulletPoints.filter((point) => point.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <List searchBarPlaceholder="Search Memos">
      {filteredBulletPoints.map((point, index) => (
        <List.Item
          key={`${file.path}-${index}`}
          title={point.replace("- ", "")}
          actions={
            <ActionPanel>
              <Action.Push
                title="Show Details"
                icon={Icon.Circle}
                target={<Detail markdown={point.replace("- ", "")} />}
              />
              <Action.Open title="Open File" target={file.path} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function getMatchingContent(content: string, searchText: string): string {
  if (!searchText) return "";
  const lines = content.split("\n");
  const matchingLine = lines.find((line) => line.toLowerCase().includes(searchText.toLowerCase()));
  if (matchingLine) {
    const startIndex = Math.max(0, matchingLine.toLowerCase().indexOf(searchText.toLowerCase()) - 20);
    return `${matchingLine.slice(startIndex, startIndex + 60)}...`;
  }
  return "";
}