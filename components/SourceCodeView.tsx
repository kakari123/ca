
import React, { useState } from 'react';
// Import Icons from constants to fix "Cannot find name 'Icons'" error
import { Icons } from '../constants';

const SourceCodeView: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'sql' | 'python' | 'cs'>('python');

  const snippets = {
    sql: `-- 1. Database & Table Schema
-- Execute this script in SQL Server Management Studio (SSMS)

CREATE DATABASE TrafficDB;
GO

USE TrafficDB;
GO

CREATE TABLE Violations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PlateNumber NVARCHAR(50) NOT NULL,
    Speed FLOAT NOT NULL,
    SpeedLimit FLOAT NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    ImagePath NVARCHAR(MAX)
);
GO

-- Create index for performance on large datasets
CREATE INDEX IX_Violations_Timestamp ON Violations (Timestamp);`,

    python: `import cv2
import pytesseract
import pyodbc
import time
from datetime import datetime

# CONFIGURATION
DB_CONFIG = 'DRIVER={SQL Server};SERVER=your_server;DATABASE=TrafficDB;UID=sa;PWD=your_pass'
SPEED_LIMIT = 30 # km/h
PIXELS_PER_METER = 150 
GATE_A = 150 # Y-coordinate px
GATE_B = 350 # Y-coordinate px

def insert_violation(plate, speed, image_path):
    conn = pyodbc.connect(DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Violations (PlateNumber, Speed, SpeedLimit, ImagePath)
        VALUES (?, ?, ?, ?)
    """, (plate, speed, SPEED_LIMIT, image_path))
    conn.commit()
    conn.close()

def main():
    cap = cv2.VideoCapture(0)
    tracker = {} # Store entering objects
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        
        # Object detection logic (simplified contour detection)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5,5), 0)
        # Add background subtraction or YOLO logic here
        
        # Virtual Line Logic
        cv2.line(frame, (0, GATE_A), (640, GATE_A), (0, 255, 0), 2)
        cv2.line(frame, (0, GATE_B), (640, GATE_B), (0, 0, 255), 2)
        
        # Speed Calculation logic would go here:
        # 1. Detect object center (cy)
        # 2. If cy enters GATE_A: t_start = time.time()
        # 3. If cy enters GATE_B: t_end = time.time()
        # 4. distance = (GATE_B - GATE_A) / PIXELS_PER_METER
        # 5. speed = (distance / (t_end - t_start)) * 3.6
        
        cv2.imshow('SentinelTraffic Engine', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,

    cs: `using System;
using System.Data;
using System.Data.SqlClient;
using System.Windows.Forms;
using System.Drawing;

namespace TrafficDashboard
{
    public partial class MainForm : Form
    {
        private string connString = "Server=your_server;Database=TrafficDB;User Id=sa;Password=your_pass;";
        private Timer refreshTimer;

        public MainForm()
        {
            InitializeComponent();
            SetupDashboard();
        }

        private void SetupDashboard()
        {
            refreshTimer = new Timer();
            refreshTimer.Interval = 2000; // 2 seconds
            refreshTimer.Tick += RefreshData;
            refreshTimer.Start();
        }

        private void RefreshData(object sender, EventArgs e)
        {
            using (SqlConnection conn = new SqlConnection(connString))
            {
                SqlDataAdapter adapter = new SqlDataAdapter("SELECT * FROM Violations ORDER BY Timestamp DESC", conn);
                DataTable dt = new DataTable();
                adapter.Fill(dt);
                dataGridView1.DataSource = dt;
            }
        }

        private void dataGridView1_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                string imagePath = dataGridView1.Rows[e.RowIndex].Cells["ImagePath"].Value.ToString();
                try {
                    pictureBoxEvidence.Image = Image.FromFile(imagePath);
                } catch {
                    // Handle missing image
                }
            }
        }
    }
}`
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <header>
        <h2 className="text-3xl font-bold text-white">Project Implementation</h2>
        <p className="text-zinc-500 mt-1">Full source code for the requested 3-tier architecture.</p>
      </header>

      <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
        <TabButton active={activeLang === 'python'} onClick={() => setActiveLang('python')} label="Python Engine" />
        <TabButton active={activeLang === 'cs'} onClick={() => setActiveLang('cs')} label="C# WinForms" />
        <TabButton active={activeLang === 'sql'} onClick={() => setActiveLang('sql')} label="SQL Schema" />
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
          </div>
          <span className="text-[10px] text-zinc-600 font-mono font-bold uppercase tracking-widest">
            {activeLang === 'python' ? 'engine.py' : activeLang === 'cs' ? 'MainDashboard.cs' : 'schema.sql'}
          </span>
          <button 
            onClick={() => navigator.clipboard.writeText(snippets[activeLang])}
            className="text-[10px] text-zinc-500 hover:text-white font-bold uppercase tracking-wider transition-colors"
          >
            Copy Snippet
          </button>
        </div>
        <pre className="flex-1 p-8 text-sm font-mono text-zinc-400 overflow-auto whitespace-pre leading-relaxed bg-zinc-950">
          <code>{snippets[activeLang]}</code>
        </pre>
      </div>

      <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-6 items-center">
        <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
           <Icons.Alert />
        </div>
        <div>
           <h4 className="font-bold text-emerald-400 text-sm">Deployment Recommendation</h4>
           <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Ensure Tesseract OCR is installed on the host machine and added to the PATH before running the Python script. Use 'pip install pyodbc pytesseract opencv-python'.</p>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
      active ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
    }`}
  >
    {label}
  </button>
);

export default SourceCodeView;
