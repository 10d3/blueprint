import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Component {
  name: string;
  type: "ui" | "custom";
  dependencies: {
    // Package dependencies (npm packages)
    packages?: string[];
    // Component dependencies (other components that need to be installed)
    components?: string[];
  };
  files: {
    path: string;
    content: string;
  }[];
}

// Component registry
export const components: Record<string, Component> = {};

// Load all components from the ui directory
const uiDir = path.join(__dirname, "ui");
if (fs.existsSync(uiDir)) {
  const files = fs.readdirSync(uiDir);

  for (const file of files) {
    if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
      const name = path.basename(file, path.extname(file));
      const filePath = path.join(uiDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Parse component dependencies from comments
      // Format: // @depends: component1, component2
      const dependsMatch = content.match(/@depends:\s*([^*]+)/);
      const componentDependencies = dependsMatch
        ? dependsMatch[1]
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [];

      components[name] = {
        name,
        type: "custom",
        dependencies: {
          components: componentDependencies,
        },
        files: [
          {
            path: `components/${name}.tsx`,
            content,
          },
        ],
      };
    }
  }
}

export function getComponent(name: string): Component | undefined {
  return components[name];
}

export function listComponents(): string[] {
  return Object.keys(components);
}
