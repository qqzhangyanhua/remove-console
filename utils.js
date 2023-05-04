const vscode = require("vscode");
const parser = require("@babel/parser");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;
const babelPresetTypeScript = require("@babel/preset-typescript");
 const removeConsoleLog = (code, isTypeScript = false) => {
  const ast = parser.parse(code, {
    sourceType: "module",
    presets: isTypeScript ? [babelPresetTypeScript] : [],
  });
  traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.type === "MemberExpression" &&
        path.node.callee.object.name === "console" &&
        path.node.callee.property.name === "log"
      ) {
        path.remove();
      }
    },
  });
  console.log(ast)
  return generate(ast).code;
};
//正确获取package.json的路径
async function getPackageJsonUri() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folders are open');
    return null;
  }

  const packageJsonPattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], '**/package.json');
  const packageJsonFiles = await vscode.workspace.findFiles(packageJsonPattern, '**/node_modules/**', 1);

  if (packageJsonFiles.length === 0) {
    vscode.window.showErrorMessage('No package.json file found in the workspace');
    return null;
  }

  return packageJsonFiles[0];
}

//用于返回当前项目中使用的vue版本
 async function getVueVersion() {
  // const packageJsonUri = vscode.workspace.workspaceFolders[0].uri.with({
  //   path: `${vscode.workspace.workspaceFolders[0].uri.path}/package.json`,
  // });
  const packageJsonUri = await getPackageJsonUri();
  const packageJsonContent = (
    await vscode.workspace.fs.readFile(packageJsonUri)
  ).toString();
  const packageJson = JSON.parse(packageJsonContent);

  if (packageJson.dependencies && packageJson.dependencies.vue) {
    return packageJson.dependencies.vue;
  } else if (packageJson.devDependencies && packageJson.devDependencies.vue) {
    return packageJson.devDependencies.vue;
  } else {
    return "==============null";
  }
}
module.exports = {
    removeConsoleLog,
    getVueVersion
}
