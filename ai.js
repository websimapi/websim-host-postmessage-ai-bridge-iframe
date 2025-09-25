/* AI helper module
   Uses global `websim` APIs described in the runtime:
   - websim.chat.completions.create({ messages, ... })
   - websim.imageGen({...})
   - websim.textToSpeech({...})
*/
export async function handleInstruction(){
  throw new Error("Host does not implement handleInstruction; use embedded iframe plugin for AI operations.");
}