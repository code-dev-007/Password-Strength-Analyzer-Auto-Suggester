# 🔒 PassShield — Password Strength Analyzer & Auto-Suggester

PassShield is a modern web-based Password Strength Analyzer that evaluates password security in real-time and provides intelligent suggestions to improve it. It also includes a powerful dashboard for tracking password analysis history and security trends.

---

## 🚀 Features

### 🔍 Password Analyzer

* Real-time strength analysis (Weak → Very Strong)
* Score out of 100
* Entropy calculation (Shannon Entropy)
* Crack time estimation
* Security criteria checklist

### 🧠 Smart Suggestions

* Detects weak patterns and common passwords
* Suggests improvements for stronger passwords

### 🔐 Security Insights

* SHA-256 hash preview (for educational purpose)
* Character breakdown (uppercase, lowercase, numbers, symbols)

### 📊 Dashboard Analytics

* Total passwords analyzed
* Best & average score
* Strength distribution graph
* Password trend graph (last 30 entries)
* Security radar chart

### 📁 Report Generation

* Download full HTML report
* Printable as PDF (Ctrl + P)

### 🎨 UI/UX Features

* Dark/Light mode toggle
* Cyberpunk-themed UI
* Smooth animations & charts

---

## 🛠️ Technologies Used

* HTML5
* CSS3 (Custom properties, animations)
* JavaScript (Vanilla JS)
* Web Crypto API (SHA-256 hashing)
* Canvas API (Graphs & Charts)
* LocalStorage (Data persistence)

---

## 📂 Project Structure

PassShield/
│
├── index.html        # Main analyzer page
├── dashboard.html    # Analytics dashboard
├── style.css         # Styling (Dark/Light theme)
├── script.js         # Analyzer logic
├── dashboard.js      # Dashboard logic
└── README.md         # Project documentation

---

## ⚙️ How It Works

### 1. Password Scoring Algorithm

Password strength is calculated based on:

* Length (8+, 12+)
* Uppercase & lowercase letters
* Numbers & symbols
* Not a common password
* No repeating characters

### 2. Entropy Formula

H = L × log₂(N)

Where:

* L = Length of password
* N = Character pool size

### 3. Crack Time Estimation

T = N^L / 10^9

(Assuming 1 billion guesses per second)

---

## 📸 Screens

### Analyzer Page

* Password input field
* Strength meter
* Entropy & score display

### Dashboard Page

* Statistics cards
* Graphs & charts
* Password history tracking

---

## ▶️ How to Run

1. Download or clone this repository
2. Open index.html in any browser
3. Start analyzing passwords

No installation required ✅

---

## 💡 Future Improvements

* User login & authentication system
* Cloud database integration
* Password breach API integration
* AI-based password suggestions
* Mobile app version

---

## ⚠️ Disclaimer

This tool is for educational purposes only.
Do not use real passwords while testing.

---

## 👨‍💻 Author

Developed by SANATH SHUKLA

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
