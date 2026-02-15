import React, { useState, useEffect } from 'react'

function App() {
  const [accountTypes, setAccountTypes] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [newTypeName, setNewTypeName] = useState('')

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: '',
    balance: '',
    memberTag: ''
  })

  const [newLoan, setNewLoan] = useState({
    name: '',
    totalAmount: '',
    remainingAmount: '',
    assetValue: '',
    memberTag: ''
  })

  // Dynamically determine the API URL based on the current host
  const API_URL = `http://${window.location.hostname}:3001/api`

  // Initial Fetch
  useEffect(() => {
    fetch(`${API_URL}/data`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data.accounts || [])
        setLoans(data.loans || [])
        setAccountTypes(data.accountTypes || [])
        setNewAccount(prev => ({ ...prev, type: data.accountTypes?.[0] || 'Brokerage' }))
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch data:', err)
        setIsLoading(false)
      })
  }, [])

  // Generic Save Function
  const saveData = (updatedAccounts, updatedLoans, updatedTypes) => {
    const dataToSave = {
      accounts: updatedAccounts || accounts,
      loans: updatedLoans || loans,
      accountTypes: updatedTypes || accountTypes
    }

    fetch(`${API_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    })
      .catch(err => console.error('Failed to save data:', err))
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const accountsTotal = accounts.reduce((acc, curr) => acc + parseFloat(curr.balance || 0), 0)
  const loansEquity = loans.reduce((acc, curr) => acc + (parseFloat(curr.assetValue || 0) - parseFloat(curr.remainingAmount || 0)), 0)
  const totalNetWorth = accountsTotal + loansEquity

  const handleAddAccount = (e) => {
    e.preventDefault()
    if (!newAccount.name || !newAccount.balance || !newAccount.memberTag) return

    let updatedAccounts
    if (editingId) {
      updatedAccounts = accounts.map(acc => acc.id === editingId ? { ...newAccount, id: editingId, balance: parseFloat(newAccount.balance) } : acc)
    } else {
      const accountToAdd = {
        ...newAccount,
        id: Date.now(),
        balance: parseFloat(newAccount.balance)
      }
      updatedAccounts = [...accounts, accountToAdd]
    }

    setAccounts(updatedAccounts)
    saveData(updatedAccounts, loans, accountTypes)
    setIsAccountModalOpen(false)
    setEditingId(null)
    setNewAccount({ name: '', type: accountTypes[0], balance: '', memberTag: '' })
  }

  const handleAddLoan = (e) => {
    e.preventDefault()
    if (!newLoan.name || !newLoan.remainingAmount || !newLoan.assetValue || !newLoan.memberTag) return

    let updatedLoans
    if (editingId) {
      updatedLoans = loans.map(loan => loan.id === editingId ? { ...newLoan, id: editingId, totalAmount: parseFloat(newLoan.totalAmount || 0), remainingAmount: parseFloat(newLoan.remainingAmount), assetValue: parseFloat(newLoan.assetValue) } : loan)
    } else {
      const loanToAdd = {
        ...newLoan,
        id: Date.now(),
        totalAmount: parseFloat(newLoan.totalAmount || 0),
        remainingAmount: parseFloat(newLoan.remainingAmount),
        assetValue: parseFloat(newLoan.assetValue)
      }
      updatedLoans = [...loans, loanToAdd]
    }

    setLoans(updatedLoans)
    saveData(accounts, updatedLoans, accountTypes)
    setIsLoanModalOpen(false)
    setEditingId(null)
    setNewLoan({ name: '', totalAmount: '', remainingAmount: '', assetValue: '', memberTag: '' })
  }

  const handleEditAccount = (account) => {
    setNewAccount({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      memberTag: account.memberTag
    })
    setEditingId(account.id)
    setIsAccountModalOpen(true)
  }

  const handleEditLoan = (loan) => {
    setNewLoan({
      name: loan.name,
      totalAmount: (loan.totalAmount || 0).toString(),
      remainingAmount: loan.remainingAmount.toString(),
      assetValue: loan.assetValue.toString(),
      memberTag: loan.memberTag
    })
    setEditingId(loan.id)
    setIsLoanModalOpen(true)
  }

  const handleDeleteAccount = (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta conta?')) {
      const updatedAccounts = accounts.filter(a => a.id !== id)
      setAccounts(updatedAccounts)
      saveData(updatedAccounts, loans, accountTypes)
    }
  }

  const handleDeleteLoan = (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar este empréstimo?')) {
      const updatedLoans = loans.filter(l => l.id !== id)
      setLoans(updatedLoans)
      saveData(accounts, updatedLoans, accountTypes)
    }
  }

  const handleAddType = (e) => {
    e.preventDefault()
    if (newTypeName && !accountTypes.includes(newTypeName)) {
      const updatedTypes = [...accountTypes, newTypeName]
      setAccountTypes(updatedTypes)
      saveData(accounts, loans, updatedTypes)
      setNewTypeName('')
    }
  }

  const handleDeleteType = (typeToDelete) => {
    if (window.confirm(`Eliminar o tipo "${typeToDelete}"?`)) {
      const updatedTypes = accountTypes.filter(t => t !== typeToDelete)
      setAccountTypes(updatedTypes)
      saveData(accounts, loans, updatedTypes)
    }
  }

  if (isLoading) {
    return <div className="app-container" style={{ textAlign: 'center', paddingTop: '100px' }}>A carregar dados...</div>
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-info">
          <h1 className="text-gradient">Investrack</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Acompanhe o seu património familiar.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={() => setIsTypesModalOpen(true)}>Gerir Tipos</button>
          <button className="btn-loan" onClick={() => { setEditingId(null); setIsLoanModalOpen(true); setNewLoan({ name: '', totalAmount: '', remainingAmount: '', assetValue: '', memberTag: '' }) }}>+ Empréstimo</button>
          <button onClick={() => { setEditingId(null); setIsAccountModalOpen(true); setNewAccount({ name: '', type: accountTypes[0], balance: '', memberTag: '' }) }}>+ Conta</button>
        </div>
      </header>

      <section className="glass-panel stat-card" style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Património Total</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700 }}>
          {formatCurrency(totalNetWorth)}
        </div>
      </section>

      <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.5rem' }}>Contas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        {accounts.map(account => (
          <div key={account.id} className="glass-panel stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{account.name}</h3>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{account.type}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-member">{account.memberTag}</span>
                <span
                  onClick={() => handleEditAccount(account)}
                  style={{ cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)' }}
                  title="Editar Conta"
                >
                  ✎
                </span>
                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '0', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {formatCurrency(parseFloat(account.balance))}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.5rem' }}>Empréstimos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
        {loans.map(loan => (
          <div key={loan.id} className="glass-panel stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>{loan.name}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-member">{loan.memberTag}</span>
                <span
                  onClick={() => handleEditLoan(loan)}
                  style={{ cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)' }}
                  title="Editar Empréstimo"
                >
                  ✎
                </span>
                <button
                  onClick={() => handleDeleteLoan(loan.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '0', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dívida:</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(loan.remainingAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ativo:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(loan.assetValue)}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700 }}>
                <span>Valor Líquido:</span>
                <span>{formatCurrency(loan.assetValue - loan.remainingAmount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAccountModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAccountModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Conta' : 'Adicionar Nova Conta'}</h2>
            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label>Nome da Conta</label>
                <input
                  type="text"
                  placeholder="ex: Conta Corrente CGD"
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de Conta</label>
                <select
                  value={newAccount.type}
                  onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                >
                  {accountTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Saldo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAccount.balance}
                  onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Membro do Agregado</label>
                <input
                  type="text"
                  placeholder="ex: Mario"
                  value={newAccount.memberTag}
                  onChange={e => setNewAccount({ ...newAccount, memberTag: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1 }}>{editingId ? 'Guardar' : 'Adicionar Conta'}</button>
                <button type="button" className="secondary" onClick={() => setIsAccountModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoanModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLoanModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Empréstimo' : 'Adicionar Novo Empréstimo'}</h2>
            <form onSubmit={handleAddLoan}>
              <div className="form-group">
                <label>Nome do Empréstimo</label>
                <input
                  type="text"
                  placeholder="ex: Crédito Habitação"
                  value={newLoan.name}
                  onChange={e => setNewLoan({ ...newLoan, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valor Total do Empréstimo (€) - Opcional</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newLoan.totalAmount}
                  onChange={e => setNewLoan({ ...newLoan, totalAmount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Valor em Dívida (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newLoan.remainingAmount}
                  onChange={e => setNewLoan({ ...newLoan, remainingAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valor Atual do Ativo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newLoan.assetValue}
                  onChange={e => setNewLoan({ ...newLoan, assetValue: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Membro do Agregado</label>
                <input
                  type="text"
                  placeholder="ex: Mario"
                  value={newLoan.memberTag}
                  onChange={e => setNewLoan({ ...newLoan, memberTag: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1 }}>{editingId ? 'Guardar' : 'Adicionar Empréstimo'}</button>
                <button type="button" className="secondary" onClick={() => setIsLoanModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTypesModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsTypesModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Gerir Tipos de Conta</h2>
            <form onSubmit={handleAddType} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Novo Tipo</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="ex: Imobiliário"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit">Adicionar</button>
                </div>
              </div>
            </form>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {accountTypes.map(type => (
                <div key={type} className="badge badge-member" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  {type}
                  <span
                    onClick={() => handleDeleteType(type)}
                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button className="secondary" onClick={() => setIsTypesModalOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
