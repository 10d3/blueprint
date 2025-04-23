import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import prompts from "prompts";
import { execa } from "execa";
import { getComponent, listComponents } from "../registry/index.js";

// Set to track components that have been installed to avoid duplicates
const installedComponents = new Set<string>();

export async function add(component?: string, destination = ".") {
  // Reset installed components for each command run
  installedComponents.clear();

  // If no component is specified, show a selection prompt
  if (!component) {
    const availableComponents = listComponents();

    if (availableComponents.length === 0) {
      console.log(chalk.yellow("No components available."));
      return;
    }

    const response = await prompts({
      type: "multiselect",
      name: "components",
      message: "Select components to add",
      choices: availableComponents.map((name) => ({
        title: name,
        value: name,
      })),
      hint: "Space to select, Enter to confirm",
    });

    if (!response.components || response.components.length === 0) {
      console.log(chalk.yellow("No components selected."));
      return;
    }

    // Install each selected component
    for (const comp of response.components) {
      await installComponent(comp, destination);
    }

    console.log(
      chalk.green(`\n✅ Added ${response.components.length} components`)
    );
    return;
  }

  // If a specific component is provided, install it directly
  await installComponent(component, destination);
}

// Helper function to install a single component
async function installComponent(
  component: string,
  destination: string
): Promise<boolean> {
  // Skip if already installed in this session
  if (installedComponents.has(component)) {
    return true;
  }

  // Check if component exists
  const componentData = getComponent(component);

  if (!componentData) {
    // Check if it's a shadcn component
    if (await installShadcnComponent(component)) {
      installedComponents.add(component);
      return true;
    }

    console.error(chalk.red(`Component "${component}" not found.`));
    console.log(chalk.yellow("Available components:"));
    console.log(listComponents().join(", "));
    return false;
  }

  // First, install dependencies if any
  if (
    componentData.dependencies.components &&
    componentData.dependencies.components.length > 0
  ) {
    console.log(chalk.blue(`\nInstalling dependencies for ${component}...`));

    for (const dep of componentData.dependencies.components) {
      // Recursively install component dependencies
      await installComponent(dep, destination);
    }
  }

  console.log(chalk.blue(`\nAdding ${component}...`));

  // Create the component in the destination
  for (const file of componentData.files) {
    const filePath = path.join(destination, file.path);

    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(chalk.yellow(`File already exists: ${filePath}`));
      continue;
    }

    // Write the file
    await fs.writeFile(filePath, file.content);
    console.log(chalk.green(`Created: ${filePath}`));
  }

  // Mark as installed
  installedComponents.add(component);

  console.log(chalk.green(`✅ Added ${component} component`));
  return true;
}

// Helper function to install shadcn components
async function installShadcnComponent(component: string): Promise<boolean> {
  try {
    console.log(chalk.blue(`\nInstalling shadcn ${component} component...`));

    // Try to run the shadcn-ui add command
    await execa("npx", ["shadcn-ui@latest", "add", component], {
      stdio: "inherit",
    });

    console.log(chalk.green(`✅ Added shadcn ${component} component`));
    return true;
  } catch (error) {
    console.log(
      chalk.yellow(`Failed to install shadcn ${component} component.`)
    );
    return false;
  }
}
