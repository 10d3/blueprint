import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import prompts from "prompts";
// import { getComponent, listComponents } from "../registry";

export async function remove(component?: string, destination = ".") {
  // If no component is specified, show a selection prompt
  if (!component) {
    // Get list of installed components by checking the components directory
    const componentsDir = path.join(destination, "components");
    let installedComponents: string[] = [];

    if (fs.existsSync(componentsDir)) {
      const files = fs.readdirSync(componentsDir);
      installedComponents = files
        .filter((file) => file.endsWith(".tsx") || file.endsWith(".jsx"))
        .map((file) => path.basename(file, path.extname(file)));
    }

    if (installedComponents.length === 0) {
      console.log(chalk.yellow("No components found in the project."));
      return;
    }

    const response = await prompts({
      type: "multiselect",
      name: "components",
      message: "Select components to remove",
      choices: installedComponents.map((name) => ({
        title: name,
        value: name,
      })),
      hint: "Space to select, Enter to confirm",
    });

    if (!response.components || response.components.length === 0) {
      console.log(chalk.yellow("No components selected."));
      return;
    }

    // Remove each selected component
    for (const comp of response.components) {
      await removeComponent(comp, destination);
    }

    console.log(
      chalk.green(`\n✅ Removed ${response.components.length} components`)
    );
    return;
  }

  // If a specific component is provided, remove it directly
  await removeComponent(component, destination);
}

// Helper function to remove a single component
async function removeComponent(
  component: string,
  destination: string
): Promise<boolean> {
  console.log(chalk.blue(`\nRemoving ${component}...`));

  // Get the component file path
  const componentPath = path.join(
    destination,
    "components",
    `${component}.tsx`
  );
  const componentJsxPath = path.join(
    destination,
    "components",
    `${component}.jsx`
  );

  // Check if the component exists
  if (!fs.existsSync(componentPath) && !fs.existsSync(componentJsxPath)) {
    console.log(
      chalk.yellow(`Component ${component} not found in the project.`)
    );
    return false;
  }

  // Remove the component file
  try {
    if (fs.existsSync(componentPath)) {
      await fs.remove(componentPath);
    } else if (fs.existsSync(componentJsxPath)) {
      await fs.remove(componentJsxPath);
    }

    console.log(chalk.green(`✅ Removed ${component} component`));

    // Check if components directory is empty and remove it if it is
    const componentsDir = path.join(destination, "components");
    const remainingFiles = fs.readdirSync(componentsDir);

    if (remainingFiles.length === 0) {
      await fs.remove(componentsDir);
      console.log(chalk.green("Removed empty components directory"));
    }

    return true;
  } catch (error: any) {
    console.error(chalk.red(`Error removing ${component}: ${error.message}`));
    return false;
  }
}
