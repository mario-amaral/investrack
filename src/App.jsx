import React, { useState, useEffect } from 'react'

function App() {
  const [accountTypes, setAccountTypes] = useState([])
  const [householdMembers, setHouseholdMembers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [newTypeName, setNewTypeName] = useState('')
  const [newMemberName, setNewMemberName] = useState('')

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
        setHouseholdMembers(data.householdMembers || [])
        setNewAccount(prev => ({
          ...prev,
          type: data.accountTypes?.[0] || 'Brokerage',
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
  const saveData = (updatedAccounts, updatedLoans, updatedTypes, updatedMembers) => {
    const dataToSave = {
      accounts: updatedAccounts || accounts,
      loans: updatedLoans || loans,
      accountTypes: updatedTypes || accountTypes,
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
    saveData(updatedAccounts, loans, accountTypes, householdMembers)
    setIsAccountModalOpen(false)
    setEditingId(null)
    setNewAccount({ name: '', type: accountTypes[0], balance: '', memberTag: householdMembers[0] || '' })
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
      saveData(updatedAccounts, loans, accountTypes, householdMembers)
    }
  }

  const handleDeleteLoan = (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar este empréstimo?')) {
      const updatedLoans = loans.filter(l => l.id !== id)
      setLoans(updatedLoans)
      saveData(accounts, updatedLoans, accountTypes, householdMembers)
    }
  }

  const handleAddType = (e) => {
    e.preventDefault()
    if (newTypeName && !accountTypes.includes(newTypeName)) {
      const updatedTypes = [...accountTypes, newTypeName]
      setAccountTypes(updatedTypes)
      saveData(accounts, loans, updatedTypes, householdMembers)
      setNewTypeName('')
    }
  }

  const handleDeleteType = (typeToDelete) => {
    if (window.confirm(`Eliminar o tipo "${typeToDelete}"?`)) {
      const updatedTypes = accountTypes.filter(t => t !== typeToDelete)
      setAccountTypes(updatedTypes)
      saveData(accounts, loans, updatedTypes, householdMembers)
    }
  }

  const handleAddMember = (e) => {
    e.preventDefault()
    if (newMemberName && !householdMembers.includes(newMemberName)) {
      const updatedMembers = [...householdMembers, newMemberName]
      setHouseholdMembers(updatedMembers)
      saveData(accounts, loans, accountTypes, updatedMembers)
      setNewMemberName('')
    }
  }

  const handleDeleteMember = (memberToDelete) => {
    if (window.confirm(`Eliminar o membro "${memberToDelete}"?`)) {
      const updatedMembers = householdMembers.filter(m => m !== memberToDelete)
      setHouseholdMembers(updatedMembers)
      saveData(accounts, loans, accountTypes, updatedMembers)
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
          <button className="secondary" onClick={() => setIsMembersModalOpen(true)}>Gerir Membros</button>
          <button className="secondary" onClick={() => setIsTypesModalOpen(true)}>Gerir Tipos</button>
          <button className="btn-loan" onClick={() => { setEditingId(null); setIsLoanModalOpen(true); setNewLoan({ name: '', totalAmount: '', remainingAmount: '', assetValue: '', memberTag: householdMembers[0] || '' }) }}>+ Empréstimo</button>
          <button onClick={() => { setEditingId(null); setIsAccountModalOpen(true); setNewAccount({ name: '', type: accountTypes[0], balance: '', memberTag: householdMembers[0] || '' }) }}>+ Conta</button>
        </div>
      </header>

      <section className="glass-panel hero-card" style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Património Total</h2>
        <div className="hero-value">
          {formatCurrency(totalNetWorth)}
        </div>
      </section>

      <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Contas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
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
            <div className="card-value">
              {formatCurrency(parseFloat(account.balance))}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Empréstimos</h2>
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

      {isMembersModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsMembersModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Gerir Membros do Agregado</h2>
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
    </div>
  )
}

export default App
