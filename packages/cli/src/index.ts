#!/usr/bin/env node
import { Command } from "commander";
import { add } from "./commands/add.js";
import { remove } from "./commands/remove.js";
import { listComponents } from "./registry/index.js";

const program = new Command();

program
  .name("blueprint-ui")
  .description("CLI for adding custom UI components to your project")
  .version("0.1.0");

program
  .command("add [component]")
  .description("Add a component to your project. If no component is specified, shows a selection menu.")
  .option("-d, --destination <path>", "Destination directory", ".")
  .action((component, options) => {
    add(component, options.destination);
  });

program
  .command("remove [component]")
  .description("Remove a component from your project. If no component is specified, shows a selection menu.")
  .option("-d, --destination <path>", "Destination directory", ".")
  .action((component, options) => {
    remove(component, options.destination);
  });

program
  .command("list")
  .description("List all available components")
  .action(() => {
    console.log("Available components:");
    console.log(listComponents().join(", "));
  });

program.parse();
console.log("Hello via Bun!");