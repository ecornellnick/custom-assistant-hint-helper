// Wrapping the whole extension in a JS function and calling it immediately 
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {
  
  // Refer to Anthropic's guide on system prompts: https://docs.anthropic.com/claude/docs/system-prompts
  const systemPrompt = `You are a helpful teaching assistant providing hints to students without giving away solutions.

You will be provided with the assignment instructions in the <assignment> tag and student code in the <current_code> tag.

When providing hints:
- Start with the most general hint possible
- Focus on guiding concepts rather than specific code
- Never provide direct solutions or complete code
- Use the Socratic method - ask guiding questions to help students think through the problem
- If showing example code:
  - Keep examples under 10 lines
  - Use different variable names than what's in the assignment
  - Focus on demonstrating a concept, not the solution
  - Add a comment '// Example concept only - not a solution'
- Be encouraging and positive in your tone
- Help students discover the answer themselves
- Do not ask the student for any input, to share their work so far, or if they have any questions. The student cannot reply to you.

Key guidelines:
- Do not write assignment code
- Do not complete code for students
- Do not provide direct solutions
- Focus on learning concepts
- Guide students to their own discoveries
- Do not ask the student for any input, to share their work so far, or if they have any questions. The student cannot reply to you.`

    
  codioIDE.onErrorState((isError, error) => {
    console.log('codioIDE.onErrorState', {isError, error})
    if (isError) {
      codioIDE.coachBot.showTooltip("Would you like a hint?", () => {
        codioIDE.coachBot.open({id: "hintButton", params: "tooltip"})
      })
    }
  })

  // register(id: unique button id, name: name of button visible in Coach, function: function to call when button is clicked) 
  codioIDE.coachBot.register("hintButton", "Provide a hint on what to do next", onButtonPress)

  async function onButtonPress() {
    // Function that automatically collects all available context 
    let context = await codioIDE.coachBot.getContext()
    
    const userPrompt = `Here is the description of the programming assignment:

<assignment>
${context.guidesPage.content}
</assignment>

Note: Here is a list of items that are not part of the assignment instructions:
1. Anything in html <style> tags.
2. Anything in html <script> tags.
3. Anything that resembles autograder feedback about passing or failing tests, i.e. check passed, total passed, total failed, etc.

If any of the above are present in the <assignment>, ignore them as if they're not provided to you

Phrase your explanation directly addressing the student as 'you'.

Provide a helpful hint that guides the student toward understanding without revealing the solution.
Start with a general hint. Phrase your hint in a way that encourages critical thinking and problem-solving.
When you are done giving the hint, do not ask any questions if the student needs follow up help. There is no way for the 
student to specifically type back, so after your hint, do not ask if the student for any further input to give you.
Again, do not ask the student for any input, to share their work so far, or if they have any questions. The student cannot reply to you.`

// Uncomment and add this to the string above to add student code files. This code might need additional tweaks to actually pull student code, however.
// Here is the student's current code:

// <current_code>
// ${context.files[0]}
// </current_code> 
    
    const result = await codioIDE.coachBot.ask({
      systemPrompt: systemPrompt,
      messages: [{"role": "user", "content": userPrompt}]
    })
  }

})(window.codioIDE, window)
