import React, { useState, useEffect } from 'react';
// 1. IMPORT YOUR EXISTING TEXTTYPE FILE HERE (Adjust the path if needed)
import TextType from './TextType'; 
import './randombgtext.css';

const CODE_LINES = [
  "const [state, setState] = useState(init);",
  "useEffect(() => { mount(); return clean; }, []);",
  "await fetch('/api/v1/auth/session')",
  "import { motion, AnimatePresence } from 'framer-motion';",
  "export default async function ServerComponent()",
  "Object.keys(nodes).map(key => nodes[key].id)",
  "const pipeline = (...fns) => (x) => fns.reduce((v, f) => f(v), x);",
  "window.requestAnimationFrame(step);",
  "sudo systemctl restart nginx.service",
  "chmod +x ./deploy_prod.sh",
  "docker-compose up --build -d",
  "git commit -m 'fix: resolve race condition in state pipeline'",
  "npm run build --minify --target=esnext",
  "0x7FFF + (delta & 0xFF)",
  "this.velocity.add(this.acceleration);",
  "O(n log n) // QuickSort Average Case"
];

export default function BackgroundText() {
  const [textElements, setTextElements] = useState([]);

  useEffect(() => {
    const totalElements = 12; // Controls how many items render concurrently
    const elements = [];

    for (let i = 0; i < totalElements; i++) {
      // Create a unique shuffle of the text lines for each specific node
      const shuffledPhrases = [...CODE_LINES].sort(() => 0.5 - Math.random());

      elements.push({
        id: i,
        phrases: shuffledPhrases,
        styles: {
          top: `${Math.floor(Math.random() * 80) + 10}%`,
          left: `${Math.floor(Math.random() * 65) + 5}%`,
          fontSize: `${Math.floor(Math.random() * 8) + 14}px`, // 14px to 22px
          opacity: Math.random() * 0.05 + 0.12, // Kept light (2%-7%) so it stays in background
        }
      });
    }

    setTextElements(elements);
  }, []);

  return (
    <div className="text-background-layer">
      {textElements.map((item) => (
        // 2. WRAP YOUR TEXTTYPE IN A POSITIONED CONTAINER
        <div key={item.id} className="random-bg-code-wrapper" style={item.styles}>
          <TextType
  text={item.phrases}
  typingSpeed={50}
  pauseDuration={1500}
  deletingSpeed={80}
  deleteMode="backspace"
  typeEffect="fade"
  mistakes={0}
  cursorStyle="underscore"
  cursorGlide
  showCursor
  variableSpeed
  cursorColor="#ffffff"
  prefixColor="currentColor"
  cursorBlinkDuration={0.5}
  cursorCharacter="_"
  prefix=""
/>
        </div>
      ))}
    </div>
  );
}
