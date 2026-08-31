export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <aside>
        <h1>Vantage</h1>

        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/accounts">Accounts</a>
          <a href="/transactions">Transactions</a>
          <a href="/budgets">Budgets</a>
          <a href="/goals">Goals</a>
          <a href="/strategies">Strategies</a>
          <a href="/reviews">Reviews</a>
        </nav>
      </aside>

      <main>{children}</main>
    </div>
  );
}