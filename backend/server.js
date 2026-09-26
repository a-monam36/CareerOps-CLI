const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/compile', (req, res) => {
  const { name, role, email, experience } = req.body;
  
  // 1. Read the base LaTeX template
  let tex = fs.readFileSync(path.join(__dirname, 'template.tex'), 'utf8');
  
  // 2. Inject React state into LaTeX variables
  tex = tex.replace('{{NAME}}', name);
  tex = tex.replace('{{ROLE}}', role);
  tex = tex.replace('{{EMAIL}}', email);
  tex = tex.replace('{{EXPERIENCE}}', experience);

  // 3. Write the temporary .tex file
  const tmpPath = path.join(__dirname, 'build', 'resume.tex');
  fs.writeFileSync(tmpPath, tex);

  // 4. Compile to PDF using pdflatex
  exec('pdflatex -output-directory=build resume.tex', { cwd: __dirname }, (error) => {
    if (error) {
      console.error('Compilation Error:', error);
      return res.status(500).json({ error: 'LaTeX compilation failed' });
    }
    
    // 5. Stream the compiled PDF back to the React frontend
    const pdfPath = path.join(__dirname, 'build', 'resume.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.download(pdfPath);
  });
});

app.listen(3001, () => console.log('Compiler API running on port 3001'));