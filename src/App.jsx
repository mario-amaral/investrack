import React, { useState, useEffect } from 'react'

function App() {
  const [householdMembers, setHouseholdMembers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState({ type: '', id: null, name: '' })

  const [editingId, setEditingId] = useState(null)
  const [newMemberName, setNewMemberName] = useState('')

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: '',
    balance: '',
    memberTag: '',
    investments: []
  })

  const ACCOUNT_TYPES = ["Conta à ordem", "Poupança"]
  const INVESTMENT_TYPES = ["Certificados Aforro", "ETF", "PPR", "Crypto"]

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
        setHouseholdMembers(data.householdMembers || [])
        setNewAccount(prev => ({
          ...prev,
          type: ACCOUNT_TYPES[0],
          memberTag: data.householdMembers?.[0] || ''
        }))
        setNewLoan(prev => ({
          ...prev,
          memberTag: data.householdMembers?.[0] || ''
        }))
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch data:', err)
        setIsLoading(false)
      })
  }, [])

  // Generic Save Function
  const saveData = (updatedAccounts, updatedLoans, updatedMembers) => {
    const dataToSave = {
      accounts: updatedAccounts || accounts,
      loans: updatedLoans || loans,
      householdMembers: updatedMembers || householdMembers
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

    const isInvestment = INVESTMENT_TYPES.includes(newAccount.type)
    const finalizedInvestments = newAccount.investments.map(inv => ({
      ...inv,
      amount: parseFloat(inv.amount || 0),
      currentValue: isInvestment ? parseFloat(inv.currentValue || 0) : 0
    }))

    const calculatedBalance = isInvestment
      ? finalizedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0)
      : parseFloat(newAccount.balance || 0)

    let updatedAccounts
    if (editingId) {
      updatedAccounts = accounts.map(acc => acc.id === editingId ? {
        ...newAccount,
        balance: calculatedBalance,
        investments: finalizedInvestments,
        id: editingId
      } : acc)
    } else {
      const accountToAdd = {
        ...newAccount,
        balance: calculatedBalance,
        investments: finalizedInvestments,
        id: Date.now()
      }
      updatedAccounts = [...accounts, accountToAdd]
    }

    setAccounts(updatedAccounts)
    saveData(updatedAccounts, loans, householdMembers)
    setIsAccountModalOpen(false)
    setIsInvestmentModalOpen(false)
    setEditingId(null)
    setNewAccount({ name: '', type: ACCOUNT_TYPES[0], balance: '', memberTag: householdMembers[0] || '', investments: [] })
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
    saveData(accounts, updatedLoans, accountTypes, householdMembers)
    setIsLoanModalOpen(false)
    setEditingId(null)
    setNewLoan({ name: '', totalAmount: '', remainingAmount: '', assetValue: '', memberTag: householdMembers[0] || '' })
  }

  const handleEditAccount = (account) => {
    setNewAccount({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      memberTag: account.memberTag,
      investments: account.investments || []
    })
    setEditingId(account.id)
    if (INVESTMENT_TYPES.includes(account.type)) {
      setIsInvestmentModalOpen(true)
    } else {
      setIsAccountModalOpen(true)
    }
  }

  const handleAddInvestmentField = () => {
    setNewAccount(prev => ({
      ...prev,
      investments: [...prev.investments, { amount: '', currentValue: '', date: new Date().toISOString().split('T')[0] }]
    }))
  }

  const handleUpdateInvestment = (index, field, value) => {
    const updated = [...newAccount.investments]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-calculate total balance if it's an investment type
    const totalCurrentValue = updated.reduce((sum, inv) => sum + (parseFloat(inv.currentValue) || 0), 0)

    setNewAccount(prev => ({
      ...prev,
      investments: updated,
      balance: totalCurrentValue.toString()
    }))
  }

  const handleRemoveInvestment = (index) => {
    const updated = newAccount.investments.filter((_, i) => i !== index)
    const totalCurrentValue = updated.reduce((sum, inv) => sum + (parseFloat(inv.currentValue) || 0), 0)

    setNewAccount(prev => ({
      ...prev,
      investments: updated,
      balance: totalCurrentValue.toString()
    }))
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
    const account = accounts.find(a => a.id === id)
    setDeleteConfirmInfo({ type: 'conta', id, name: account?.name || '' })
    setIsDeleteModalOpen(true)
  }

  const handleDeleteLoan = (id) => {
    const loan = loans.find(l => l.id === id)
    setDeleteConfirmInfo({ type: 'empréstimo', id, name: loan?.name || '' })
    setIsDeleteModalOpen(true)
  }

  const handleAddMember = (e) => {
    e.preventDefault()
    if (newMemberName && !householdMembers.includes(newMemberName)) {
      const updatedMembers = [...householdMembers, newMemberName]
      setHouseholdMembers(updatedMembers)
      saveData(accounts, loans, updatedMembers)
      setNewMemberName('')
    }
  }

  const handleDeleteMember = (memberToDelete) => {
    setDeleteConfirmInfo({ type: 'membro', id: memberToDelete, name: memberToDelete })
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    const { type, id } = deleteConfirmInfo
    if (type === 'conta') {
      const updatedAccounts = accounts.filter(a => a.id !== id)
      setAccounts(updatedAccounts)
      saveData(updatedAccounts, loans, householdMembers)
    } else if (type === 'empréstimo') {
      const updatedLoans = loans.filter(l => l.id !== id)
      setLoans(updatedLoans)
      saveData(accounts, updatedLoans, householdMembers)
    } else if (type === 'membro') {
      const updatedMembers = householdMembers.filter(m => m !== id)
      setHouseholdMembers(updatedMembers)
      saveData(accounts, loans, updatedMembers)
    }
    setIsDeleteModalOpen(false)
  }

  if (isLoading) {
    return <div className="app-container" style={{ textAlign: 'center', paddingTop: '100px' }}>A carregar dados...</div>
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-info" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img src="/assets/logo.svg" alt="Investrack Logo" className="app-logo" />
          <div>
            <h1 className="text-gradient">Investrack</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Património da família Pinho Amaral</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={() => setIsMembersModalOpen(true)}>Gerir Membros</button>
          <button className="btn-loan" onClick={() => { setEditingId(null); setIsLoanModalOpen(true); setNewLoan({ name: '', totalAmount: '', remainingAmount: '', assetValue: '', memberTag: householdMembers[0] || '', interestRate: '', monthlyPayment: '', maturityDate: '' }) }}>+ Empréstimo</button>
          <button className="btn-investment" onClick={() => { setEditingId(null); setIsInvestmentModalOpen(true); setNewAccount({ name: '', type: INVESTMENT_TYPES[0], balance: '', memberTag: householdMembers[0] || '', investments: [] }) }}>+ Investimento</button>
          <button onClick={() => { setEditingId(null); setIsAccountModalOpen(true); setNewAccount({ name: '', type: ACCOUNT_TYPES[0], balance: '', memberTag: householdMembers[0] || '', investments: [] }) }}>+ Conta</button>
        </div>
      </header>

      <section className="glass-panel hero-card" style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Património Total</h2>
        <div className="hero-value">
          {formatCurrency(totalNetWorth)}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        {accounts.map(account => (
          <div key={account.id} className="glass-panel stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h3 className="card-title">{account.name}</h3>
                <span className="card-subtitle">{account.type}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-member" style={{ fontSize: '0.65rem' }}>{account.memberTag}</span>
                <button
                  className="action-btn edit"
                  onClick={() => handleEditAccount(account)}
                  title="Editar Conta"
                >
                  ✎
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDeleteAccount(account.id)}
                  title="Eliminar Conta"
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="card-value">{formatCurrency(parseFloat(account.balance))}</span>
                {INVESTMENT_TYPES.includes(account.type) && account.investments?.length > 0 && (() => {
                  const totalInvested = account.investments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
                  const currentTotalValue = account.investments.reduce((sum, inv) => sum + (parseFloat(inv.currentValue) || 0), 0)
                  const profit = currentTotalValue - totalInvested
                  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0
                  const isPositive = profit >= 0

                  return (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Investido: {formatCurrency(totalInvested)}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isPositive ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {isPositive ? '+' : ''}{formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
        {loans.map(loan => {
          const ltv = ((loan.remainingAmount / loan.assetValue) * 100).toFixed(1)
          return (
            <div key={loan.id} className="glass-panel stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 className="card-title">{loan.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-member" style={{ fontSize: '0.65rem' }}>{loan.memberTag}</span>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditLoan(loan)}
                    title="Editar Empréstimo"
                  >
                    ✎
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteLoan(loan.id)}
                    title="Eliminar Empréstimo"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Dívida:</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--danger)', textAlign: 'right' }}>{formatCurrency(loan.remainingAmount)}</div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ativo:</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--success)', textAlign: 'right' }}>{formatCurrency(loan.assetValue)}</div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Taxa:</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'right' }}>{loan.interestRate}%</div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prestação:</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'right' }}>{formatCurrency(loan.monthlyPayment)}</div>

                <div style={{ gridColumn: 'span 2', height: '1px', background: 'var(--glass-border)', margin: '0.1rem 0' }}></div>

                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Líquido:</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, textAlign: 'right' }}>{formatCurrency(loan.assetValue - loan.remainingAmount)}</div>

                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>LTV: {ltv}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Termina: {loan.maturityDate || 'N/A'}</div>
              </div>
            </div>
          )
        })}
      </div>

      {isAccountModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAccountModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{editingId ? 'Editar Conta' : 'Adicionar Nova Conta'}</h2>
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
                  {ACCOUNT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Saldo Corrente (€)</label>
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
                <select
                  value={newAccount.memberTag}
                  onChange={e => setNewAccount({ ...newAccount, memberTag: e.target.value })}
                  required
                >
                  <option value="" disabled>Selecionar membro</option>
                  {householdMembers.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="submit" style={{ flex: 1 }}>{editingId ? 'Guardar' : 'Adicionar Conta'}</button>
                <button type="button" className="secondary" onClick={() => setIsAccountModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInvestmentModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsInvestmentModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{editingId ? 'Editar Investimento' : 'Registar Investimento'}</h2>
            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label>Designação (ex: Big PPR, ETF World)</label>
                <input
                  type="text"
                  placeholder="Nome do ativo"
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de Ativo</label>
                <select
                  value={newAccount.type}
                  onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                >
                  {INVESTMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Valor Atual de Mercado (€)</label>
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
                <select
                  value={newAccount.memberTag}
                  onChange={e => setNewAccount({ ...newAccount, memberTag: e.target.value })}
                  required
                >
                  <option value="" disabled>Selecionar membro</option>
                  {householdMembers.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>

              {INVESTMENT_TYPES.includes(newAccount.type) && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem' }}>Histórico de Compras (Custo Base)</h3>
                    <button type="button" onClick={handleAddInvestmentField} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>+ Entrada</button>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {newAccount.investments.map((inv, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem' }}>Montante (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={inv.amount}
                            onChange={e => handleUpdateInvestment(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            style={{ padding: '0.5rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem' }}>Valor Atual (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={inv.currentValue}
                            onChange={e => handleUpdateInvestment(index, 'currentValue', e.target.value)}
                            placeholder="0.00"
                            style={{ padding: '0.5rem', border: '1px solid var(--accent-primary)' }}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem' }}>Data</label>
                          <input
                            type="date"
                            value={inv.date}
                            onChange={e => handleUpdateInvestment(index, 'date', e.target.value)}
                            style={{ padding: '0.5rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleRemoveInvestment(index)}
                          style={{ padding: '0.5rem', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {newAccount.investments.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Nenhuma entrada registada.</p>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1 }}>{editingId ? 'Guardar' : 'Registar'}</button>
                <button type="button" className="secondary" onClick={() => setIsInvestmentModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoanModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLoanModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{editingId ? 'Editar Empréstimo' : 'Adicionar Novo Empréstimo'}</h2>
            <form onSubmit={handleAddLoan}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                  <label>Dívida (€)</label>
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
                  <label>Valor do Ativo (€)</label>
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
                  <label>Taxa de Juro (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newLoan.interestRate}
                    onChange={e => setNewLoan({ ...newLoan, interestRate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Prestação (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newLoan.monthlyPayment}
                    onChange={e => setNewLoan({ ...newLoan, monthlyPayment: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fim do Contrato</label>
                  <input
                    type="date"
                    value={newLoan.maturityDate}
                    onChange={e => setNewLoan({ ...newLoan, maturityDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Membro</label>
                  <select
                    value={newLoan.memberTag}
                    onChange={e => setNewLoan({ ...newLoan, memberTag: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecionar</option>
                    {householdMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" style={{ flex: 1 }}>{editingId ? 'Guardar' : 'Adicionar'}</button>
                <button type="button" className="secondary" onClick={() => setIsLoanModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {isMembersModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsMembersModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Gerir Membros do Agregado</h2>
            <form onSubmit={handleAddMember} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Novo Membro</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="ex: Maria"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit">Adicionar</button>
                </div>
              </div>
            </form>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {householdMembers.map(member => (
                <div key={member} className="badge badge-member" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--accent-secondary)' }}>
                  {member}
                  <span
                    onClick={() => handleDeleteMember(member)}
                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button className="secondary" onClick={() => setIsMembersModalOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                color: 'var(--danger)'
              }}>⚠️</div>
              <h2 style={{ marginBottom: '0.5rem' }}>Confirmar Eliminação</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Tem a certeza que deseja eliminar {deleteConfirmInfo.type} <strong>"{deleteConfirmInfo.name}"</strong>?
                <br />Esta ação não pode ser desfeita.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, backgroundColor: 'var(--danger)', border: 'none' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
