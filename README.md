# 💰 Personal Finance Tracker

Welcome! This is a modern, intuitive web application designed to help you take control of your finances. Track every dollar you spend, create custom budgets, and use advanced analytics to understand your spending patterns. Best of all, test different financial scenarios with our "what-if" simulation feature to plan ahead confidently.

## 🌟 Key Features

### 📊 **Dashboard & Analytics**
- **Multi-period Analysis**: View financial summaries across multiple budgets
- **Interactive Charts**: 
  - Category breakdown with bar charts
  - Monthly spending trends (12-month history)
  - Budget performance visualization
- **Real-time Summary Cards**: Total budget, spent amount, remaining balance, income/expenses

### 💳 **Budget Management**
- Create and manage multiple budgets per period (month/year)
- Multi-category budgets: Assign multiple categories to a single budget
- Budget performance tracking with visual indicators
- Monthly budget limits with rollover options

### 📝 **Transaction Management**
- Add income and expense transactions with categories and dates
- Transaction filtering by category, date range, and budget
- Organized transaction history view
- Category-based transaction management

### 🏷️ **Category Management**
- Create custom income and expense categories
- Assign color codes to categories
- Edit and delete categories with confirmation
- Category-based spending insights

### ⚡ **What-If Scenario Simulation**
- Simulate budget changes by percentage or fixed amount
- Real-time impact visualization:
  - Updated charts and tables
  - Impact on budget remaining amounts
  - Category spending projections
- Compare current vs. simulated scenarios instantly

### 🔐 **User Authentication**
- Secure email/password authentication
- Email verification system
- Password reset functionality
- Session management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite |
| **Styling** | CSS-in-JS |
| **Charts** | Recharts |
| **Backend** | Supabase (PostgreSQL) |
| **Auth** | Supabase Authentication |
| **State** | React Hooks (useState, useContext, useMemo) |

---

## 🚀 Quick Start

### Prerequisites
Before getting started, make sure you have:
- **Node.js 16+** (download from [nodejs.org](https://nodejs.org))
- **npm or yarn** (comes with Node.js)
- **A free Supabase account** (we'll create one in the setup)

### Step-by-Step Setup

#### 1️⃣ **Clone the Repository**
```bash
git clone <repository-url>
cd my-finance-tracker
```

#### 2️⃣ **Install Dependencies**
```bash
npm install
```
This downloads all the libraries the app needs. It might take a minute or two.

#### 3️⃣ **Create Your Supabase Project**

Don't have Supabase yet? No worries, it's free!

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose a name (e.g., "my-finance-tracker")
4. Create a strong password and save it somewhere safe
5. Choose your region (pick one closest to you)
6. Wait for the project to be created (usually takes 1-2 minutes)

#### 4️⃣ **Get Your Supabase Credentials**

1. In your Supabase project, click **Settings** (gear icon) in the sidebar
2. Go to **API** tab
3. Copy your **Project URL** (looks like `https://xxxx.supabase.co`)
4. Copy your **Anon Key** (a long string starting with `eyJ...`)

#### 5️⃣ **Setup Environment Variables**

Create a `.env.local` file in your project root with your Supabase credentials:

**On macOS/Linux:**
```bash
cp .env.example .env.local
```

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**On Windows (CMD):**
```cmd
copy .env.example .env.local
```

Now open `.env.local` in your text editor and fill in your Supabase details:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 6️⃣ **Setup Your Database**

This is important! The app needs database tables to store your data.

1. Go back to your Supabase project
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Open the file `supabase_setup.sql` from this project
5. Copy and paste the entire content into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. You should see "Success" messages - that's great!

Now repeat the process for the second file:
1. Click **New Query** again
2. Open `supabase_migration_budget_periods.sql`
3. Copy and paste it into the SQL Editor
4. Click **Run**

✅ Your database is now ready!

#### 7️⃣ **Enable Email Authentication**

This allows users to sign up and reset their passwords:

1. In your Supabase project, go to **Authentication** → **Providers**
2. Find **Email** and make sure it's **Enabled**
3. Click on Email to expand it
4. Check "Confirm email" for extra security (recommended)

#### 8️⃣ **Start the App**

```bash
npm run dev
```

You should see something like:
```
Local:            http://localhost:5173/
```

Open that URL in your browser and you're done! 🎉

### Running the App Again (Next Time)

Once everything is set up, you just need:
```bash
npm run dev
```

That's it! No need to repeat the setup steps.

---

## 📖 How to Use This App

### Getting Started (First Time)

**Creating an Account**
1. Click "Sign Up" on the login page
2. Enter your email and create a strong password (at least 10 characters)
3. Check your email inbox for a verification link and click it
4. You're in! 🎉

**Forgot Your Password?**
- Click "Forgot Password" on the login page
- Enter your email
- Check your inbox for a reset link

### 💳 Your First Budget

Think of a budget as a "spending limit" for a category in a specific month.

1. Click on **Budgets** in the sidebar
2. Click "Create New Budget"
3. Give it a name (e.g., "Groceries - May 2026")
4. Pick the month and year
5. Set your spending limit (e.g., $500)
6. Choose which categories this budget covers (you can pick multiple!)
7. Click "Save Budget" ✓

**Pro Tip:** You can have multiple budgets! Create one for groceries, another for entertainment, and so on.

### 📝 Adding Your Spending

Every time you spend money, add it here:

1. Go to **Transactions**
2. Click "Add Transaction"
3. Fill in:
   - **Type**: Choose "Expense" (for money you spent) or "Income" (for money you earned)
   - **Amount**: How much did you spend? (e.g., 45.99)
   - **Category**: What did you spend it on? (Groceries, Gas, Coffee, etc.)
   - **Date**: When did this happen?
   - **Description**: Optional note (e.g., "Whole Foods shopping")
4. Click "Add" and you're done!

### 📊 Viewing Your Analytics

This is where you see the big picture of your finances:

1. Click **Analysis** in the sidebar
2. **On the left sidebar**: Select which budgets you want to analyze (or leave them all selected for the full picture)
3. You'll see:
   - **Summary Cards**: Your total budget, how much you've spent, and how much is left
   - **Category Chart**: Visual bars showing your biggest spending categories
   - **Monthly Trend**: A line graph showing your last 12 months of spending patterns
   - **Budget Overview Table**: Details of each budget

### 🎯 Using Scenario Simulation (The "What-If" Tool)

Want to know what would happen if you spent less? This feature is perfect for planning!

1. In the **Analysis** section, click "Simulate Scenario"
2. A form appears. Here's what to do:
   - **Select budgets**: Choose which budgets to test (optional)
   - **Simulation type**: 
     - **Percentage**: "What if I reduce expenses by 20%?"
     - **Amount**: "What if I reduce expenses by exactly $100?"
   - **Adjust the value**: Enter your number
3. Click **"Suggest"** button and the app will recommend a reduction based on your habits (optional - or enter your own)
4. Click "Simulate Scenario" to see the results
5. Look at the "Impact Summary" to see how this would affect you over 3 months
6. Click "Clear Simulation" to go back to your real numbers

**Example:** Want to see if cutting dining out by 30% helps? Enter -30% and simulate!

### 🏷️ Managing Your Categories

Categories are how you organize your spending. Your first few might be: Groceries, Gas, Entertainment, etc.

1. Go to **Categories** in the sidebar
2. **To edit**: Click on a category and change its name or pick a new color
3. **To delete**: Click on a category, then confirm the deletion

**Creating New Categories** happens when you add a transaction - if a category doesn't exist, you can create it on the fly!

---

## � Tips & Tricks

**Making the Most of Your Finance Tracker:**

- 📱 **Categories are your friends** - Create specific categories for all your spending types. The more detailed, the better insights you'll get
- 📊 **Review your trends monthly** - Spend 5 minutes each month checking the Analysis dashboard. You'll start spotting patterns
- 🎯 **Use budgets for problem areas** - If you overspend on coffee, create a specific budget for it. It helps keep you accountable
- 🔮 **Test scenarios before big changes** - Before committing to a spending cut, simulate it first to see if it's realistic
- 🌙 **Budget for the month ahead** - At the beginning of each month, create your budgets. Then throughout the month, just add transactions
- 💰 **Track income too** - Don't just log expenses! Adding income transactions gives you a complete financial picture

---

## �📁 Project Structure

```
my-finance-tracker/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── analysis.jsx     # Dashboard & analytics
│   │   ├── budget.jsx       # Budget management
│   │   ├── transactionlist.jsx  # Transaction listing & filtering
│   │   ├── categorymanager.jsx   # Category CRUD
│   │   ├── addtransaction.jsx    # Transaction form
│   │   ├── ScenarioSimulateButton.jsx  # Simulation trigger
│   │   ├── ScenarioSimulateModal.jsx   # Simulation form
│   │   ├── styles/          # Component-specific styles
│   │   └── utils/           # Helper functions
│   ├── hooks/               # Custom React hooks
│   │   ├── useauth.js       # Authentication logic
│   │   ├── usebudgets.js    # Budget operations
│   │   ├── usetransactions.js  # Transaction operations
│   │   └── usecategories.js # Category operations
│   ├── lib/
│   │   └── supabase.js      # Supabase client config
│   ├── App.jsx              # Main app component
│   ├── login.jsx            # Login page
│   └── main.jsx             # React entry point
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

---

## 🔐 Security Features

- **Row Level Security (RLS)**: Database policies ensure users can only access their own data
- **Email Verification**: Prevents unauthorized account access
- **Auth Tokens**: Secure Supabase authentication with JWT tokens
- **Input Validation**: Form validation on both client and server
- **HTTPS**: All Supabase communication is encrypted

---

## 🚀 Performance Optimizations

- **Memoized Computations**: Uses `useMemo` for expensive calculations
- **Optimized Filtering**: Efficient category and budget filtering logic
- **Lazy Evaluation**: Modal and advanced features load on demand

---

## 🛠️ Development

### Build & Deploy
```bash
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run dev        # Start dev server
```

### Common Issues & Solutions

**🔴 "Error: Cannot find module '@supabase/supabase-js'"**
- You forgot to run `npm install`! Do that first, then restart your app with `npm run dev`

**🔴 "VITE_SUPABASE_URL is not defined"**
- Your `.env.local` file is missing or has the wrong name
- Make sure it's in your project root (same level as `package.json`)
- Restart the dev server after creating/editing `.env.local`

**🔴 "Authentication fails" or "Invalid credentials"**
- Double-check your Supabase URL and Anon Key in `.env.local`
- Make sure you copied the ENTIRE key (they're long strings!)
- Verify Email authentication is enabled in your Supabase project (Settings → Authentication)

**🔴 "Charts aren't showing any data"**
- Add some transactions first! Charts need data to display
- Make sure transactions are linked to the correct categories
- Check the browser console (F12) for any error messages

**🔴 "Can't log in / Email verification not working"**
- Check your email spam/junk folder for the verification email
- Make sure "Confirm email" is enabled in Supabase (Settings → Authentication → Email)
- Try signing up with a different email address

**🔴 "Budget/Transaction won't save"**
- Check your browser console for error messages (press F12)
- Verify your Supabase project is still active and has available connections
- Make sure all required fields are filled out

---

## � About This Project

This is a personal finance application built as a **Final Year Project (FYP)**. It's designed to be intuitive, secure, and help real people take control of their finances.

---

## 🤝 Questions or Issues?

1. **Check the troubleshooting section above** - it covers the most common issues
2. **Check the Supabase console** - it often has helpful error messages
3. **Review the browser console** - Press F12 to open Developer Tools and look for error messages
4. **Check your `.env.local` file** - Make sure it has the correct values

---

## 📄 License

This project is created for educational and open-source purposes.

---

**Happy budgeting! 💰** 

Made with ❤️ for better financial awareness

**Last Updated**: May 2026
