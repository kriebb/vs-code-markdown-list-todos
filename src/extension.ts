'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "listing-keywords" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        
        // The code you place here will be executed every time your command is executed

        let doc = vscode.window.activeTextEditor.document;

        let todoCounter:number = 0;
        for(let i = 0; i < doc.lineCount; i++)
        {
            console.log("line "+ i)
            try
            {
                let line:vscode.TextLine = doc.lineAt(i);
                if(line.text.length >= "TODO:".length)
                {
                let regexp:RegExp = new RegExp('^(.*)*(TODO:)([A-Za-z0-9\D]+)*$');
                let isKeyWord:boolean = regexp.test(line.text);

                if(isKeyWord)
                    todoCounter++;
                }
            }
            catch(exception)
            {
                console.log(exception);
            }
            
        }
        
        vscode.window.setStatusBarMessage("Count Todo's: "+todoCounter)

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}