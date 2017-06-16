'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { List } from './linq';

class GenerateKeyWordList
{
    messagesCount = new Array<vscode.Disposable>();

    process = (editor: vscode.TextEditor ) => {
        let doc = editor.document;

        let todoCounter:number = 0;
        for(let i = 0; i < doc.lineCount; i++)
        {
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
        
        for(let i = 0 ; i < this.messagesCount.length; i++)
        {
            this.messagesCount[i].dispose();
        }
        
        let disposable =  vscode.window.setStatusBarMessage("Count Todo's: "+todoCounter)

        this.messagesCount.push(disposable);
    }

    dispose = () => {
        for(let i = 0 ; i < this.messagesCount.length; i++)
        {
            this.messagesCount[i].dispose();
        }
    }
}

export class ToDoGenerator {
    public addAnchor: boolean = true;
    private _todoStartLine: string  = "<!-- vscode-markdown-todo -->";
    private _todoEndLine: string  = "<!-- /vscode-markdown-todo -->";
    private _todoStartLineNumber : number = 0;
    private _todoEndLineNumber : number = 0;
    private _endAnchor: string = "</a>";


    public ToDoGenerator()
    {

    }
    public  process = () => {
   
    let editor = vscode.window.activeTextEditor;
    let doc = editor.document;
    let todos : List<Todo> = this.buildTodos(this.buildLineTodos(doc));
    let tocSummary : string = this.buildSummary(todos);
    console.log(tocSummary);

    editor.edit((editBuilder: vscode.TextEditorEdit)=>{
      todos.ForEach(todo => {
        let lineText : string = "";
        
        if(this.addAnchor){
          lineText = lineText.concat("<a name='" + todo.anchor +"'></a>");
        }
        lineText.concat("TODO: ");
        lineText = lineText.concat(todo.originalText);
        editBuilder.replace(new vscode.Range(todo.lineNumber, 0, todo.lineNumber, todo.lineLength), lineText);
      });
      
      if(this._todoStartLineNumber + this._todoEndLineNumber == 0){
        editBuilder.insert(new vscode.Position(0, 0), tocSummary);
      } else {
        editBuilder.replace(new vscode.Range(this._todoStartLineNumber, 0, this._todoEndLineNumber, this._todoEndLine.length), tocSummary);
      }
      
      return Promise.resolve();
    });
    
    doc.save();
  }

  buildSummary = (todos : List<Todo>) : string => {
    let todoSummary : string = this._todoStartLine + "\r\n";

    let todosIncrement = 0;
    todos.ForEach(todo => {
        todosIncrement++;
      let todoLine : string = "";
      
      todoLine = todoLine.concat(todosIncrement+".");
      
      
      if(this.addAnchor) {
        todoLine = todoLine.concat(" [" + todo.titleSummary + "](#" + todo.anchor + ")");
      } else {
        todoLine = todoLine.concat(" " + todo.titleSummary);
      }
      
      if(todoLine != null && todoLine != ""){
        todoSummary = todoSummary.concat(todoLine + "\n");
      }
    });

    todoSummary = todoSummary.concat("\n" + this._todoEndLine);

    return todoSummary;
  }
  

  buildTodos = (lines: List<Todo>) : List<Todo> => {
    let todoLines : List<Todo> = new List<Todo>();

    lines.ForEach(todoLine => {

      if(this.addAnchor) {
        todoLine.setAnchorUnique(todoLines.Count(x => x.anchor == todoLine.anchor));
      }
      todoLines.Add(todoLine);
    });

    return todoLines;
  }

  buildLineTodos = (doc: vscode.TextDocument) : List<Todo> => {
    let todos = new List<Todo>();
    let insideTripleBacktickCodeBlock: boolean = false;

    for (var lineNumber = 0; lineNumber < doc.lineCount; lineNumber++) 
    {
        let aLine = doc.lineAt(lineNumber);

        //Ignore empty lines
        if(aLine.isEmptyOrWhitespace) continue;
        
        let lineText = aLine.text.trim();
        
        // Locate if todo was already generated
        if(lineText.startsWith(this._todoStartLine))
        {
        this._todoStartLineNumber = lineNumber;
        continue;
        } 
        else if (lineText.startsWith(this._todoEndLine)) 
        {
            this._todoEndLineNumber = lineNumber;
            continue;
        }
        
        //If we are within a triple-backtick code blocks, then ignore
        if(lineText.startsWith("```")) 
        {
            if(insideTripleBacktickCodeBlock) continue;
            
            insideTripleBacktickCodeBlock = !insideTripleBacktickCodeBlock;
        }
        
        try
        {

            if(lineText.length >= "TODO:".length)
            {
                let regexp:RegExp = new RegExp('(TODO):(.*)',"gi");
                let result:RegExpExecArray = regexp.exec(lineText);

                if(result != null)
                {

                    if(result == null) continue;
                    if(result.length <= 0 ) continue;

                    let originalTextTodo = result[2];
                    let maximumLength = 0;
                    if(originalTextTodo.length > 10)
                        maximumLength = 10;
                    else
                        maximumLength = originalTextTodo.length;

                    let foundTodoSummary = 'TODO:' + originalTextTodo.substr(0,maximumLength);
                    let titleSummary: string = foundTodoSummary;
                        
                    // Remove anchor in the title
                    if(lineText.indexOf(this._endAnchor) > 0) {
                        lineText = lineText.substring(titleSummary.indexOf(this._endAnchor)  + this._endAnchor.length);
                    }

                    todos.Add(new Todo(
                        titleSummary, 
                        lineText,
                        lineNumber, 
                        aLine.text.length));
                }

            }
        }
        catch(exception)
        {
            console.log(exception);
        }
 }

    return todos;
  }
}


/**
 * Todo
 */
class Todo {
  titleSummary: string;
  originalText: string;
  anchor: string;
  lineNumber: number;
  lineLength: number;

  constructor(
      titleSummary: string,
      originalText: string,
      lineNumber: number,
      lineLength: number) {
        this.titleSummary = titleSummary;
        this.originalText = originalText;
        this.lineNumber = lineNumber;
        this.lineLength = lineLength;
        this.anchor = this.titleSummary.replace(/[^a-z0-9\-_:\.]|^[^a-z]+/gi, "");
  }

  setAnchorUnique(index: number){
    if(index > 0){
      this.anchor = this.anchor + "-" + index;
    }
  }
}


let todoGenerator = new ToDoGenerator();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.listTodos', () => {
        
        // The code you place here will be executed every time your command is executed

        todoGenerator.process();
    

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
    todoGenerator = null;
}



