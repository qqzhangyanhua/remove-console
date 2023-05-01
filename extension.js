
const vscode = require('vscode');
const vueCompiler = require("vue-template-compiler");
const vueCompilerSfc = require("@vue/compiler-sfc");
const semver = require("semver");
const { getVueVersion, removeConsoleLog } = require("./utils");
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand(
	  "formatCheckCode.removeConsoleLog",
	  async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
		  vscode.window.showErrorMessage("No open text editor");
		  return;
		}
  
		const document = editor.document;
		if (
		  document.languageId !== "javascript" &&
		  document.languageId !== "vue" &&
		  document.languageId !== "typescript"
		) {
		  vscode.window.showErrorMessage("只能在.vue或.js或.ts文件中使用该命令");
		  return;
		}
		const text = document.getText();
  
		let newText = text;
		if (
		  document.languageId === "javascript" ||
		  document.languageId === "typescript"
		) {
		  newText = removeConsoleLog(text, document.languageId === "typescript");
		} else if (document.languageId === "vue") {
		  const vueVersion = await getVueVersion();
		  if (vueVersion) {
			const parsedVersion = semver.coerce(vueVersion);
			if (semver.satisfies(parsedVersion, "^2.0.0")) {
			  const parsedVueFile = vueCompiler.parseComponent(text);
			  const isTypeScript =
				parsedVueFile.script &&
				(parsedVueFile.script.lang === "ts" ||
				  parsedVueFile.script.lang === "typescript");
  
			  if (parsedVueFile.script) {
				const updatedScriptContent = removeConsoleLog(
				  parsedVueFile.script.content,
				  isTypeScript
				);
				newText = text.replace(
				  parsedVueFile.script.content,
				  updatedScriptContent
				);
			  }
			} else if (semver.satisfies(parsedVersion, "^3.0.0")) {
			  const parsedVueFile = vueCompilerSfc.parse(text);
			  const isTypeScript =
				parsedVueFile.script &&
				(parsedVueFile.script.lang === "ts" ||
				  parsedVueFile.script.lang === "typescript");
  
			  //k可能是setup的方式
			  if (parsedVueFile.descriptor.script) {
				const updatedScriptContent = removeConsoleLog(
				  parsedVueFile.descriptor.script.content,
				  isTypeScript
				);
				newText = text.replace(
				  parsedVueFile.descriptor.script.content,
				  updatedScriptContent
				);
			  }
			  if (parsedVueFile.descriptor.scriptSetup) {
				const updatedScriptContent = removeConsoleLog(
				  parsedVueFile.descriptor.scriptSetup.content
				);
				newText = text.replace(
				  parsedVueFile.descriptor.scriptSetup.content,
				  updatedScriptContent
				);
			  }
			}
		  }
		}
  
		const fullRange = new vscode.Range(
		  document.positionAt(0),
		  document.positionAt(text.length)
		);
  
		editor.edit((editBuilder) => {
		  editBuilder.replace(fullRange, newText);
		});
	  }
	);
  
	context.subscriptions.push(disposable);
  }

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
