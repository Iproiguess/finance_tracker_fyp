# 💰 Personal Finance Tracker

A modern, feature-rich web application for tracking personal finances. Manage transactions, budgets, categories, and visualize your financial data with advanced analytics and "what-if" scenario simulation.

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
- Node.js 16+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
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
   
   Then edit `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Setup Supabase database**
   - Log in to your Supabase project
   - Navigate to SQL Editor
   - Run the SQL scripts in order:
     - `supabase_setup.sql` - Creates tables, policies, and RLS
     - `supabase_migration_budget_periods.sql` - Budget period migrations

5. **Run development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

### Running the app again (after first setup)
   ```bash
   cd my-finance-tracker
   npm run dev
   ```
   No need to clone, install dependencies, or setup environment variables again.

---

## 📖 Usage Guide

### Login & Authentication
1. Sign up with email and password
2. Verify your email (check inbox for verification link)
3. Login with your credentials

### Creating Your First Budget
1. Navigate to **Budgets** section
2. Click "Create New Budget"
3. Enter budget name, select month/year
4. Set monthly limit
5. Select categories to track in this budget
6. Click "Save Budget"

### Adding Transactions
1. Go to **Transactions**
2. Click "Add Transaction"
3. Fill in:
   - Type (Income/Expense)
   - Amount
   - Category
   - Date
   - Description (optional)
4. Click "Add"

### Viewing Analytics
1. Navigate to **Analysis**
2. Select budgets from the sidebar (or view all)
3. View:
   - Summary cards (totals, remaining)
   - Category breakdown chart
   - Monthly spending trend
   - Budget overview table

### Using Scenario Simulation
1. In **Analysis**, click "Simulate Scenario"
2. Choose simulation type:
   - **Percentage**: If spending increases/decreases by X%
   - **Amount**: Set specific spending amount per category
3. Adjust values and click "Simulate"
4. View real-time impact on all charts and tables
5. Click "Clear Simulation" to return to actual values

### Managing Categories
1. Go to **Categories** section
2. View all your categories
3. Edit category: Click category → modify name/color → Save
4. Delete category: Click category → Confirm deletion

---

## 📁 Project Structure

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

### Common Issues

**Environment variables not loading?**
- Ensure `.env.local` exists in project root
- Restart dev server after editing `.env.local`
- Variables must be prefixed with `VITE_`

**Authentication fails?**
- Verify Supabase project URL and key are correct
- Check email verification status in Supabase console
- Ensure RLS policies are enabled

**Charts not showing?**
- Verify you have transactions in selected budget
- Check browser console for data fetch errors
- Ensure categories are properly linked to transactions

---

## 📝 License

This project is created for educational purposes.

---

## 👤 Author

Created as a Final Year Project (FYP) - Personal Finance Tracker Application

---

## 🤝 Support

For issues or questions, please refer to the troubleshooting section above or check the Supabase console for detailed error logs.

---

**Last Updated**: April 2026
