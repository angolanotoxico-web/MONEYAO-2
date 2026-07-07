import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, setLogLevel } from 'firebase/firestore';
import { 
  User, 
  Investment, 
  Deposit, 
  Withdrawal, 
  Commission, 
  ProfitLog, 
  SecurityLog,
  RecoveryRequest,
  PRODUCTS_AO_CONFIG,
  GiftCode
} from './src/types.js';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Inicialização do Firebase Firestore para Persistência Durável em Cloud Run
let firestoreDb: any = null;
const syncedCache = new Map<string, string>();

try {
  // Silenciar logs de conexões ociosas benignas (e.g. gRPC streams cancelados quando ociosos)
  setLogLevel('error');
  
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true
    }, firebaseConfig.firestoreDatabaseId || '(default)');
    console.log('[Firebase] Firestore inicializado com sucesso para persistência durável!');
  } else {
    console.warn('[Firebase] Arquivo firebase-applet-config.json não encontrado.');
  }
} catch (err) {
  console.error('[Firebase] Erro ao inicializar Firestore:', err);
}

// Utilização de JSON para parsing do corpo da requisição
app.use(express.json({ limit: '10mb' }));

// Helper de criptografia para palavra-passe (SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Estado Inicial do Banco de Dados
interface DbSchema {
  users: Record<string, User>; // phone -> User
  investments: Investment[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  commissions: Commission[];
  profitLogs: ProfitLog[];
  securityLogs: SecurityLog[];
  recoveryRequests: RecoveryRequest[];
  simulatedTime: string; // ISO String do relógio do sistema simulado
  autoProfitPayout: boolean; // Ativação/desativação automática do pagamento de rendimentos
  timeOffsetMs?: number; // Offset de simulação de tempo em milissegundos
  giftCodes: GiftCode[];
}

// Gerador Sequencial de Códigos de Convite (AO001 - AO999)
function generateNextInviteCode(users: Record<string, User>): string {
  const codes = Object.values(users)
    .map(u => u.myInviteCode)
    .filter(code => code && /^AO\d{3,4}$/i.test(code));
  
  if (codes.length === 0) {
    return 'AO001';
  }
  
  let maxNum = 1; // O Admin é o primeiro (AO001)
  for (const code of codes) {
    const num = parseInt(code.substring(2), 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  
  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, '0');
  return `AO${padded}`;
}

const INITIAL_DB: DbSchema = {
  users: {
    '942691403': {
      phone: '942691403',
      name: 'Administrador MoneyAO',
      passwordHash: hashPassword('123456'),
      inviteCode: 'MASTER',
      myInviteCode: 'AO001',
      balance: 15000,
      totalInvested: 0,
      totalEarnings: 0,
      registeredAt: new Date('2026-07-01T12:00:00Z').toISOString(),
      status: 'active',
      failedAttempts: 0,
      lockoutUntil: null,
      referredBy: null,
      role: 'admin'
    }
  },
  investments: [],
  deposits: [],
  withdrawals: [],
  commissions: [],
  profitLogs: [],
  securityLogs: [
    {
      id: 'seclog_seed',
      phone: '942691403',
      action: 'SYSTEM_INIT',
      details: 'Sistema iniciado com administrador oficial pré-semeado (Código: AO001)',
      ipAddress: '127.0.0.1',
      createdAt: new Date('2026-07-01T12:00:00Z').toISOString()
    }
  ],
  recoveryRequests: [],
  simulatedTime: new Date('2026-07-03T03:51:00Z').toISOString(), // Sincronizado com tempo da sessão
  autoProfitPayout: true,
  timeOffsetMs: 0,
  giftCodes: []
};

// Helper para obter a hora e data atual de Angola (WAT, UTC+1)
function getAngolaTimeISO(): string {
  const d = new Date();
  const offsetMs = 1 * 60 * 60 * 1000; // WAT (UTC+1)
  const localDate = new Date(d.getTime() + offsetMs);
  return localDate.toISOString().replace('Z', '+01:00');
}

// Cache global do banco de dados em memória para alta performance
let memoryDb: DbSchema | null = null;
let isWriting = false;
let writePending = false;

// Preencher cache de chaves já sincronizadas
function populateSyncedCache(db: DbSchema) {
  syncedCache.clear();
  
  Object.entries(db.users).forEach(([phone, user]) => {
    syncedCache.set(`user_${phone}`, JSON.stringify(user));
  });
  
  db.investments.forEach(item => {
    syncedCache.set(`investment_${item.id}`, JSON.stringify(item));
  });
  
  db.deposits.forEach(item => {
    syncedCache.set(`deposit_${item.id}`, JSON.stringify(item));
  });
  
  db.withdrawals.forEach(item => {
    syncedCache.set(`withdrawal_${item.id}`, JSON.stringify(item));
  });
  
  db.commissions.forEach(item => {
    syncedCache.set(`commission_${item.id}`, JSON.stringify(item));
  });
  
  db.profitLogs.forEach(item => {
    syncedCache.set(`profitLog_${item.id}`, JSON.stringify(item));
  });
  
  db.securityLogs.forEach(item => {
    syncedCache.set(`securityLog_${item.id}`, JSON.stringify(item));
  });
  
  db.recoveryRequests.forEach(item => {
    syncedCache.set(`recoveryRequest_${item.id}`, JSON.stringify(item));
  });
  
  db.giftCodes.forEach(item => {
    syncedCache.set(`giftCode_${item.code}`, JSON.stringify(item));
  });

  syncedCache.set('config', JSON.stringify({
    simulatedTime: db.simulatedTime,
    autoProfitPayout: db.autoProfitPayout,
    timeOffsetMs: db.timeOffsetMs
  }));
}

// Semeia o Firestore com o banco de dados inicial
async function seedFirestore(db: DbSchema) {
  if (!firestoreDb) return;
  console.log('[Firebase] Semeando Firestore...');
  try {
    const promises: Promise<any>[] = [];

    Object.entries(db.users).forEach(([phone, user]) => {
      promises.push(setDoc(doc(firestoreDb, 'users', phone), user));
    });

    db.securityLogs.forEach(log => {
      promises.push(setDoc(doc(firestoreDb, 'securityLogs', log.id), log));
    });

    promises.push(setDoc(doc(firestoreDb, 'system', 'config'), {
      simulatedTime: db.simulatedTime,
      autoProfitPayout: db.autoProfitPayout,
      timeOffsetMs: db.timeOffsetMs
    }));

    await Promise.all(promises);
    console.log('[Firebase] Semeadura finalizada com sucesso!');
    populateSyncedCache(db);
  } catch (err) {
    console.error('[Firebase] Erro ao semear Firestore:', err);
  }
}

// Sincroniza o banco de dados em memória para o Firestore de forma assíncrona inteligente (incremental e sem bloqueio)
async function syncToFirestore(db: DbSchema) {
  if (!firestoreDb) return;
  
  try {
    const currentKeys = new Set<string>();
    const writePromises: Promise<any>[] = [];

    // 1. Sincronizar usuários
    Object.entries(db.users).forEach(([phone, user]) => {
      const key = `user_${phone}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(user);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'users', phone), user).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 2. Sincronizar investimentos
    db.investments.forEach(item => {
      const key = `investment_${item.id}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'investments', item.id), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 3. Sincronizar depósitos
    db.deposits.forEach(item => {
      const key = `deposit_${item.id}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'deposits', item.id), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 4. Sincronizar levantamentos (withdrawals)
    db.withdrawals.forEach(item => {
      const key = `withdrawal_${item.id}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'withdrawals', item.id), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 5. Sincronizar comissões
    db.commissions.forEach(item => {
      const key = `commission_${item.id}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'commissions', item.id), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 6. Sincronizar logs de lucros
    db.profitLogs.forEach(item => {
      const key = `profitLog_${item.id}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'profitLogs', item.id), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 7. Sincronizar logs de segurança
    db.securityLogs.forEach(item => {
      const key = `securityLog_${item.id}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'securityLogs', item.id), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 8. Sincronizar solicitações de recuperação
    db.recoveryRequests.forEach(item => {
      const key = `recoveryRequest_${item.id}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'recoveryRequests', item.id), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 9. Sincronizar códigos de presente
    db.giftCodes.forEach(item => {
      const key = `giftCode_${item.code}`;
      currentKeys.add(key);
      const currentJson = JSON.stringify(item);
      if (syncedCache.get(key) !== currentJson) {
        writePromises.push(
          setDoc(doc(firestoreDb, 'giftCodes', item.code), item).then(() => {
            syncedCache.set(key, currentJson);
          })
        );
      }
    });

    // 10. Sincronizar configuração
    const configKey = 'config';
    currentKeys.add(configKey);
    const configData = {
      simulatedTime: db.simulatedTime,
      autoProfitPayout: db.autoProfitPayout,
      timeOffsetMs: db.timeOffsetMs
    };
    const configJson = JSON.stringify(configData);
    if (syncedCache.get(configKey) !== configJson) {
      writePromises.push(
        setDoc(doc(firestoreDb, 'system', 'config'), configData).then(() => {
          syncedCache.set(configKey, configJson);
        })
      );
    }

    // 11. Tratar remoções/exclusões de documentos obsoletos do Firestore
    const deletePromises: Promise<any>[] = [];
    syncedCache.forEach((_, key) => {
      if (!currentKeys.has(key)) {
        const parts = key.split('_');
        const type = parts[0];
        const id = parts.slice(1).join('_');
        
        let collectionName = '';
        if (type === 'user') collectionName = 'users';
        else if (type === 'investment') collectionName = 'investments';
        else if (type === 'deposit') collectionName = 'deposits';
        else if (type === 'withdrawal') collectionName = 'withdrawals';
        else if (type === 'commission') collectionName = 'commissions';
        else if (type === 'profitLog') collectionName = 'profitLogs';
        else if (type === 'securityLog') collectionName = 'securityLogs';
        else if (type === 'recoveryRequest') collectionName = 'recoveryRequests';
        else if (type === 'giftCode') collectionName = 'giftCodes';

        if (collectionName) {
          console.log(`[Firebase] Removendo documento obsoleto do Firestore: ${collectionName}/${id}`);
          deletePromises.push(
            deleteDoc(doc(firestoreDb, collectionName, id)).then(() => {
              syncedCache.delete(key);
            })
          );
        }
      }
    });

    await Promise.all([...writePromises, ...deletePromises]);
  } catch (err) {
    console.error('[Firebase] Erro na sincronização assíncrona do Firestore:', err);
  }
}

// Gravação de Banco de Dados JSON sem bloqueio e com tratamento de fila
function saveDb(db: DbSchema): void {
  // Limitar o tamanho dos logs para alta performance e evitar ficheiros gigantes sob uso em massa
  if (db.securityLogs && db.securityLogs.length > 2000) {
    db.securityLogs = db.securityLogs.slice(-2000);
  }
  if (db.profitLogs && db.profitLogs.length > 2000) {
    db.profitLogs = db.profitLogs.slice(-2000);
  }
  
  memoryDb = db;
  
  // Sincronizar com o Firestore em segundo plano (assíncrono, não bloqueia a resposta da API!)
  syncToFirestore(db).catch(err => {
    console.error('[Firebase] Erro na sincronização de segundo plano do Firestore:', err);
  });
  
  if (isWriting) {
    writePending = true;
    return;
  }
  
  flushDbToDisk();
}

function flushDbToDisk(): void {
  if (!memoryDb) return;
  isWriting = true;
  
  // Escrita assíncrona para manter o Event Loop do Node.js totalmente livre e responsivo
  fs.writeFile(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf8', (err) => {
    isWriting = false;
    if (err) {
      console.error('Erro ao gravar db.json de forma assíncrona:', err);
    }
    
    if (writePending) {
      writePending = false;
      flushDbToDisk();
    }
  });
}

// Fallback síncrono para carregar do disco local db.json
function loadDbFallback(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(data);
      let changed = false;

      if (!db.recoveryRequests) {
        db.recoveryRequests = [];
        changed = true;
      }

      if (!db.giftCodes) {
        db.giftCodes = [];
        changed = true;
      }
      
      if (db.timeOffsetMs === undefined) {
        db.timeOffsetMs = 0;
        changed = true;
      }

      const currentAngolaTime = getAngolaTimeISO();
      const calculatedSimulatedTime = new Date(new Date(currentAngolaTime).getTime() + Number(db.timeOffsetMs || 0)).toISOString();
      if (db.simulatedTime !== calculatedSimulatedTime) {
        db.simulatedTime = calculatedSimulatedTime;
        changed = true;
      }

      if (db.autoProfitPayout === undefined) {
        db.autoProfitPayout = true;
        changed = true;
      }
      if (db.users) {
        if (db.users['942691403'] && db.users['942691403'].myInviteCode !== 'AO001') {
          db.users['942691403'].myInviteCode = 'AO001';
          changed = true;
        }

        const allUsers = Object.values(db.users) as User[];
        const needsCode = allUsers.filter(u => u.phone !== '942691403' && (!u.myInviteCode || !/^AO\d{3,4}$/i.test(u.myInviteCode)));
        
        if (needsCode.length > 0) {
          needsCode.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
          for (const u of needsCode) {
            u.myInviteCode = generateNextInviteCode(db.users);
            changed = true;
          }
        }
      }

      if (db.investments) {
        const initialCount = db.investments.length;
        // Filtrar e eliminar investimentos do fundo antigo
        db.investments = db.investments.filter(inv => inv.productType !== 'fixed_90');
        if (db.investments.length !== initialCount) {
          changed = true;
          
          // Recalcular totalInvested para cada utilizador
          if (db.users) {
            Object.keys(db.users).forEach(phone => {
              const userActiveInvestments = db.investments.filter(inv => inv.phone === phone && inv.status === 'active');
              const totalInvested = userActiveInvestments.reduce((sum, inv) => sum + inv.amount, 0);
              if (db.users[phone].totalInvested !== totalInvested) {
                db.users[phone].totalInvested = totalInvested;
              }
            });
          }
        }

        db.investments.forEach(inv => {
          if (inv.productType === 'daily') {
            const prodConfig = PRODUCTS_AO_CONFIG.find(p => p.id === inv.productId);
            if (prodConfig && inv.dailyProfit !== prodConfig.dailyReturn) {
              inv.dailyProfit = prodConfig.dailyReturn;
              changed = true;
            }
          }
        });
      }
      
      memoryDb = db;
      if (changed) {
        saveDb(db);
      }
      
      return db;
    }
  } catch (err) {
    console.error('Erro ao ler db.json local:', err);
  }

  memoryDb = JSON.parse(JSON.stringify(INITIAL_DB));
  saveDb(memoryDb!);
  return memoryDb!;
}

// Carregar toda a base de dados de forma assíncrona do Firestore na inicialização do servidor
async function loadDbAsync(): Promise<DbSchema> {
  if (memoryDb) {
    return memoryDb;
  }

  if (!firestoreDb) {
    console.warn('[Firebase] Firestore indisponível. Usando fallback de disco local...');
    return loadDbFallback();
  }

  try {
    console.log('[Firebase] Carregando coleções do Firestore para memória...');
    const [
      usersSnap,
      investmentsSnap,
      depositsSnap,
      withdrawalsSnap,
      commissionsSnap,
      profitLogsSnap,
      securityLogsSnap,
      recoveryRequestsSnap,
      giftCodesSnap,
      configDocSnap
    ] = await Promise.all([
      getDocs(collection(firestoreDb, 'users')),
      getDocs(collection(firestoreDb, 'investments')),
      getDocs(collection(firestoreDb, 'deposits')),
      getDocs(collection(firestoreDb, 'withdrawals')),
      getDocs(collection(firestoreDb, 'commissions')),
      getDocs(collection(firestoreDb, 'profitLogs')),
      getDocs(collection(firestoreDb, 'securityLogs')),
      getDocs(collection(firestoreDb, 'recoveryRequests')),
      getDocs(collection(firestoreDb, 'giftCodes')),
      getDoc(doc(firestoreDb, 'system', 'config'))
    ]);

    const users: Record<string, User> = {};
    usersSnap.forEach(docSnap => {
      users[docSnap.id] = docSnap.data() as User;
    });

    // Se o Firestore não contiver utilizadores, semeia a base de dados
    if (Object.keys(users).length === 0) {
      console.log('[Firebase] Sem registros de usuários no Firestore. Semeando dados padrão...');
      const db = JSON.parse(JSON.stringify(INITIAL_DB));
      memoryDb = db;
      await seedFirestore(db);
      return db;
    }

    const investments: Investment[] = [];
    investmentsSnap.forEach(docSnap => {
      investments.push(docSnap.data() as Investment);
    });

    const deposits: Deposit[] = [];
    depositsSnap.forEach(docSnap => {
      deposits.push(docSnap.data() as Deposit);
    });

    const withdrawals: Withdrawal[] = [];
    withdrawalsSnap.forEach(docSnap => {
      withdrawals.push(docSnap.data() as Withdrawal);
    });

    const commissions: Commission[] = [];
    commissionsSnap.forEach(docSnap => {
      commissions.push(docSnap.data() as Commission);
    });

    const profitLogs: ProfitLog[] = [];
    profitLogsSnap.forEach(docSnap => {
      profitLogs.push(docSnap.data() as ProfitLog);
    });

    const securityLogs: SecurityLog[] = [];
    securityLogsSnap.forEach(docSnap => {
      securityLogs.push(docSnap.data() as SecurityLog);
    });

    const recoveryRequests: RecoveryRequest[] = [];
    recoveryRequestsSnap.forEach(docSnap => {
      recoveryRequests.push(docSnap.data() as RecoveryRequest);
    });

    const giftCodes: GiftCode[] = [];
    giftCodesSnap.forEach(docSnap => {
      giftCodes.push(docSnap.data() as GiftCode);
    });

    let simulatedTime = INITIAL_DB.simulatedTime;
    let autoProfitPayout = INITIAL_DB.autoProfitPayout;
    let timeOffsetMs = INITIAL_DB.timeOffsetMs;

    if (configDocSnap.exists()) {
      const configData = configDocSnap.data();
      if (configData.simulatedTime) simulatedTime = configData.simulatedTime;
      if (configData.autoProfitPayout !== undefined) autoProfitPayout = configData.autoProfitPayout;
      if (configData.timeOffsetMs !== undefined) timeOffsetMs = configData.timeOffsetMs;
    }

    const db: DbSchema = {
      users,
      investments,
      deposits,
      withdrawals,
      commissions,
      profitLogs,
      securityLogs,
      recoveryRequests,
      simulatedTime,
      autoProfitPayout,
      timeOffsetMs,
      giftCodes
    };

    // Sincronizar relógio em tempo real
    const currentAngolaTime = getAngolaTimeISO();
    const calculatedSimulatedTime = new Date(new Date(currentAngolaTime).getTime() + Number(db.timeOffsetMs || 0)).toISOString();
    if (db.simulatedTime !== calculatedSimulatedTime) {
      db.simulatedTime = calculatedSimulatedTime;
    }

    memoryDb = db;
    
    // Guardar cópia em db.json local como backup/fallback
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf8');
    
    // Preencher o cache de sincronização
    populateSyncedCache(db);

    console.log(`[Firebase] Banco de dados durável carregado do Firestore: ${Object.keys(users).length} usuários, ${investments.length} investimentos.`);
    return db;
  } catch (err) {
    console.error('[Firebase] Erro fatal ao carregar do Firestore. Usando fallback de disco local...', err);
    return loadDbFallback();
  }
}

// Carregar ou Inicializar Banco de Dados com cache inteligente em memória (Retorno síncrono rápido para as rotas)
function loadDb(): DbSchema {
  if (memoryDb) {
    // Sincronizar relógio em tempo real de forma segura com Angola + Offset de simulação
    const currentAngolaTime = getAngolaTimeISO();
    const calculatedSimulatedTime = new Date(new Date(currentAngolaTime).getTime() + Number(memoryDb.timeOffsetMs || 0)).toISOString();
    if (memoryDb.simulatedTime !== calculatedSimulatedTime) {
      memoryDb.simulatedTime = calculatedSimulatedTime;
    }
    return memoryDb;
  }

  return loadDbFallback();
}

// Log de Segurança
function writeSecurityLog(db: DbSchema, phone: string | null, action: string, details: string, reqIp?: string): void {
  const newLog: SecurityLog = {
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    phone,
    action,
    details,
    ipAddress: reqIp || '127.0.0.1',
    createdAt: db.simulatedTime
  };
  db.securityLogs.push(newLog);
}

// --- ROTAS DA API ---

// 1. Registro (Cadastro)
app.post('/api/auth/register', (req, res) => {
  const db = loadDb();
  const { phone, name, password, confirmPassword, inviteCode } = req.body;
  const ip = req.ip || '127.0.0.1';

  if (!phone || !name || !password || !confirmPassword || !inviteCode) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  // Limite Profissional de Segurança: 10.000 Usuários
  const totalRegisteredUsers = Object.keys(db.users).length;
  if (totalRegisteredUsers >= 10000) {
    return res.status(400).json({ error: 'O limite máximo profissional de 10.000 utilizadores do sistema foi atingido.' });
  }

  // Prevenção de Fraudes: Bloqueio automatizado de registos com números de telefone duplicados
  if (db.users[phone]) {
    writeSecurityLog(db, phone, 'FRAUD_PREVENTION', `Tentativa de cadastro com número duplicado do IP ${ip}`);
    saveDb(db);
    return res.status(400).json({ error: 'Este número de telefone já está registrado no sistema.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'As palavras-passe não coincidem.' });
  }

  // Código de Convite (Indicação) Obrigatório
  // Deve ser o código de algum usuário existente ou o master "ADMIN123"
  let referredByUser: User | null = null;
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  if (normalizedInviteCode !== 'ADMIN123') {
    let found = Object.values(db.users).find(u => u.myInviteCode && u.myInviteCode.toUpperCase() === normalizedInviteCode);
    if (!found) {
      // Tentar encontrar também pelo número de telefone direto do padrinho
      const cleanInviteCode = normalizedInviteCode.replace(/\s+/g, '');
      found = db.users[cleanInviteCode] || Object.values(db.users).find(u => u.phone === cleanInviteCode);
    }
    
    if (!found) {
      writeSecurityLog(db, null, 'INVALID_INVITE_ATTEMPT', `Tentativa de cadastro com código inválido: ${inviteCode}`);
      saveDb(db);
      return res.status(400).json({ error: 'Código de convite inválido ou expirado. É obrigatório ter um convite válido.' });
    }
    referredByUser = found;
  }

  // Gerar próximo código de convite sequencial no formato AO001 - AO999
  const nextInviteCode = generateNextInviteCode(db.users);

  // Criar Usuário
  const newUser: User = {
    phone,
    name,
    passwordHash: hashPassword(password),
    inviteCode: normalizedInviteCode,
    myInviteCode: nextInviteCode, // Sequência de Número AO001 - AO999
    balance: 0,
    totalInvested: 0,
    totalEarnings: 0,
    registeredAt: db.simulatedTime,
    status: 'active',
    failedAttempts: 0,
    lockoutUntil: null,
    referredBy: referredByUser ? referredByUser.phone : null,
    role: phone === '942691403' ? 'admin' : 'user'
  };

  db.users[phone] = newUser;
  writeSecurityLog(db, phone, 'USER_REGISTER', `Usuário cadastrado com sucesso. Convidado por: ${referredByUser ? referredByUser.phone : 'ADMIN (Direto)'}`, ip);
  saveDb(db);

  // Não retornar hash da senha
  const { passwordHash, ...safeUser } = newUser;
  res.json({ message: 'Conta criada com sucesso!', user: safeUser });
});

// 2. Login com Bloqueio de Segurança
app.post('/api/auth/login', (req, res) => {
  const db = loadDb();
  const { phone, password } = req.body;
  const ip = req.ip || '127.0.0.1';

  if (!phone || !password) {
    return res.status(400).json({ error: 'Telefone e palavra-passe são obrigatórios.' });
  }

  const user = db.users[phone];
  if (!user) {
    return res.status(401).json({ error: 'Número de telefone ou palavra-passe incorretos.' });
  }

  // Verificar Bloqueio por Tentativas Falhas (15 minutos)
  if (user.lockoutUntil) {
    const lockoutTime = new Date(user.lockoutUntil).getTime();
    const currentTime = new Date(db.simulatedTime).getTime();
    if (currentTime < lockoutTime) {
      const remainingMin = Math.ceil((lockoutTime - currentTime) / 60000);
      writeSecurityLog(db, phone, 'LOGIN_BLOCKED_ATTEMPT', `Tentativa de acesso de conta temporariamente bloqueada do IP ${ip}`);
      saveDb(db);
      return res.status(403).json({ error: `Esta conta está bloqueada por excesso de tentativas falhadas. Tente novamente em ${remainingMin} minutos.` });
    } else {
      // Tempo de bloqueio expirou, limpar estado
      user.lockoutUntil = null;
      user.failedAttempts = 0;
    }
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Sua conta foi suspensa por atividade suspeita pelo administrador.' });
  }

  const hash = hashPassword(password);
  if (user.passwordHash !== hash) {
    user.failedAttempts += 1;
    writeSecurityLog(db, phone, 'LOGIN_FAILED', `Falha de login número ${user.failedAttempts}. IP: ${ip}`, ip);

    if (user.failedAttempts >= 5) {
      // Bloquear conta por 15 minutos em relação ao relógio simulado
      const lockoutDate = new Date(new Date(db.simulatedTime).getTime() + 15 * 60 * 1000);
      user.lockoutUntil = lockoutDate.toISOString();
      writeSecurityLog(db, phone, 'ACCOUNT_LOCKOUT', `Conta bloqueada temporariamente até ${user.lockoutUntil} devido a 5 tentativas de login incorretas`, ip);
    }

    saveDb(db);
    return res.status(401).json({ error: 'Número de telefone ou palavra-passe incorretos.' });
  }

  // Sucesso
  user.failedAttempts = 0;
  user.lockoutUntil = null;
  writeSecurityLog(db, phone, 'LOGIN_SUCCESS', `Login efetuado com sucesso do IP ${ip}`, ip);
  saveDb(db);

  const { passwordHash, ...safeUser } = user;
  res.json({ message: 'Login efetuado com sucesso!', user: safeUser });
});

// 3. Buscar Dados Detalhados do Usuário ou por Código de Convite
app.get('/api/user/profile/:phoneOrCode', (req, res) => {
  const db = loadDb();
  const { phoneOrCode } = req.params;
  
  // Buscar primeiro por telefone, se não encontrar, buscar por myInviteCode de forma insensível a maiúsculas/minúsculas
  let user = db.users[phoneOrCode];
  if (!user) {
    user = Object.values(db.users).find(
      u => u.myInviteCode && u.myInviteCode.toUpperCase() === phoneOrCode.trim().toUpperCase()
    );
  }

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const phone = user.phone;

  // Otimização de Performance para Escala (Bulk/Massa):
  // Mapeia todos os convites em um único dicionário O(1) para evitar múltiplos loops O(N^2)
  const referralsBySponsor: Record<string, User[]> = {};
  const allUsersList = Object.values(db.users);
  
  allUsersList.forEach(u => {
    if (u.referredBy) {
      if (!referralsBySponsor[u.referredBy]) {
        referralsBySponsor[u.referredBy] = [];
      }
      referralsBySponsor[u.referredBy].push(u);
    }
  });

  const directReferrals = referralsBySponsor[phone] || [];
  
  const level2Referrals: User[] = [];
  directReferrals.forEach(d => {
    const refs = referralsBySponsor[d.phone] || [];
    level2Referrals.push(...refs);
  });

  const level3Referrals: User[] = [];
  level2Referrals.forEach(l2 => {
    const refs = referralsBySponsor[l2.phone] || [];
    level3Referrals.push(...refs);
  });

  const commissions = db.commissions.filter(c => c.referrerPhone === phone);
  const totalCommisionEarned = commissions
    .filter(c => c.status === 'credited')
    .reduce((sum, c) => sum + c.amount, 0);

  const myInvestments = db.investments.filter(i => i.phone === phone);

  const { passwordHash, ...safeUser } = user;
  res.json({
    user: safeUser,
    investments: myInvestments,
    referrals: {
      level1Count: directReferrals.length,
      level2Count: level2Referrals.length,
      level3Count: level3Referrals.length,
      totalCount: directReferrals.length + level2Referrals.length + level3Referrals.length
    },
    totalCommissionEarned: totalCommisionEarned,
    simulatedTime: db.simulatedTime
  });
});

// 3.5. Alterar Palavra-passe do Utilizador (Própria Conta)
app.post('/api/user/change-password', (req, res) => {
  const db = loadDb();
  const { phone, currentPassword, newPassword, confirmNewPassword } = req.body;
  const ip = req.ip || '127.0.0.1';

  if (!phone || !currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: 'Todos os campos são de preenchimento obrigatório.' });
  }

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Esta conta encontra-se suspensa.' });
  }

  // Validar senha atual
  const currentHash = hashPassword(currentPassword);
  if (user.passwordHash !== currentHash) {
    writeSecurityLog(db, phone, 'PASSWORD_CHANGE_FAILED', `Falha ao tentar mudar a palavra-passe (senha atual incorreta) do IP ${ip}`, ip);
    saveDb(db);
    return res.status(400).json({ error: 'A palavra-passe atual indicada está incorreta.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'As novas palavras-passe indicadas não coincidem.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova palavra-passe deve conter pelo menos 6 caracteres.' });
  }

  // Atualizar senha
  user.passwordHash = hashPassword(newPassword);
  writeSecurityLog(db, phone, 'PASSWORD_CHANGED', `O utilizador alterou a sua própria palavra-passe com sucesso do IP ${ip}`, ip);
  saveDb(db);

  res.json({ message: 'A sua palavra-passe foi alterada com sucesso!' });
});

// 4. Fluxo de Depósito (Solicitar Depósito)
app.post('/api/deposits/create', (req, res) => {
  const db = loadDb();
  const { phone, amount, method, provider, reference, receiptUrl, transactionId } = req.body;

  if (!phone || !amount || !method || !provider || !reference || !transactionId) {
    return res.status(400).json({ error: 'Preencha todos os dados do comprovativo de depósito, incluindo o ID de Transação bancária.' });
  }

  const cleanTxId = String(transactionId).trim().toUpperCase();

  // Validar o formato do ID da transação de bancos angolanos com regex correspondente
  if (method === 'crypto') {
    if (!/^[A-Z0-9]{8,64}$/i.test(cleanTxId)) {
      return res.status(400).json({ error: 'ID de Transação Crypto inválido. Deve ter de 8 a 64 caracteres alfanuméricos.' });
    }
  } else if (provider === 'BFA') {
    if (!/^(FT\d{10,12}|\d{10,16})$/i.test(cleanTxId)) {
      return res.status(400).json({ error: 'ID de Transação inválido para o Banco BFA. Deve iniciar com FT seguido de 10-12 dígitos ou conter de 10-16 números.' });
    }
  } else if (provider === 'BAI') {
    if (!/^(REF\d{9,13}|BAI\d{8,12}|\d{10,16})$/i.test(cleanTxId)) {
      return res.status(400).json({ error: 'ID de Transação inválido para o Banco BAI. Deve iniciar com REF, BAI ou ser uma sequência numérica de 10-16 números.' });
    }
  } else if (provider === 'Unitel Money') {
    if (!/^(UM-)?[A-Z0-9]{8,14}$/i.test(cleanTxId)) {
      return res.status(400).json({ error: 'ID de Transação inválido para Unitel Money. Deve conter entre 8 a 14 caracteres alfanuméricos.' });
    }
  } else if (provider === 'PayPay') {
    if (!/^(PP-)?[A-Z0-9]{8,14}$/i.test(cleanTxId)) {
      return res.status(400).json({ error: 'ID de Transação inválido para PayPay. Deve conter entre 8 a 14 caracteres alfanuméricos.' });
    }
  } else {
    if (!/^[A-Z0-9.\-\/]{8,24}$/i.test(cleanTxId)) {
      return res.status(400).json({ error: 'ID de Transação bancária inválido. Insira um número de referência de 8 a 24 caracteres.' });
    }
  }

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Verificar se o ID de Transação já foi enviado anteriormente para evitar duplicados
  const exists = db.deposits.some(d => d.transactionId && d.transactionId.trim().toUpperCase() === cleanTxId);
  if (exists) {
    return res.status(400).json({ error: 'Este ID de Transação / Nº de comprovativo já foi submetido na nossa plataforma.' });
  }

  const depositId = 'dep_' + Math.random().toString(36).substr(2, 9);
  const newDeposit: Deposit = {
    id: depositId,
    phone,
    amount: Number(amount),
    method,
    provider,
    reference,
    receiptUrl: receiptUrl || 'default_receipt.png',
    transactionId: cleanTxId,
    status: 'pending',
    createdAt: db.simulatedTime
  };

  db.deposits.push(newDeposit);
  writeSecurityLog(db, phone, 'DEPOSIT_SUBMITTED', `Solicitação de depósito de ${amount} Kz criada com o ID de Transação ${cleanTxId}. Aguardando aprovação administrativa.`);
  saveDb(db);

  // Retorna com a mensagem exata requerida no fluxo
  res.json({
    message: 'Comprovativo enviado com sucesso! Aguarde entre 5 a 30 minutos para que os valores sejam creditados na sua conta.',
    deposit: newDeposit
  });
});

// 5. Motores de Investimento: Ativação / Compra de Produto AO ou Fundo a Prazo
app.post('/api/investments/buy', (req, res) => {
  const db = loadDb();
  const { phone, productId, amount } = req.body;

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Verificar o limite máximo de 5 aquisições para o mesmo produto por utilizador
  const existingCount = db.investments.filter(inv => inv.phone === phone && inv.productId === productId && (inv.status === 'active' || inv.status === 'pending')).length;
  if (existingCount >= 5) {
    return res.status(400).json({ error: 'Limite de compra atingido. Só é possível possuir no máximo 5 unidades ativas/adquiridas do mesmo plano/produto.' });
  }

  if (productId === 'fixed_30' || productId === 'fixed_60' || productId === 'fixed_90') {
    // Fundo de Investimento a Prazo (30, 60 ou 90 Dias)
    const investAmount = Number(amount);
    if (!investAmount || investAmount <= 0) {
      return res.status(400).json({ error: 'Defina o valor a alocar ao fundo de investimento.' });
    }

    if (user.balance < investAmount) {
      return res.status(400).json({ error: `Saldo insuficiente. Precisa de ${investAmount.toLocaleString()} Kz.` });
    }

    // Deduzir do saldo através de transação automática
    user.balance -= investAmount;
    user.totalInvested += investAmount;

    // Calcular data de maturação baseada no prazo selecionado
    const days = productId === 'fixed_30' ? 30 : productId === 'fixed_60' ? 60 : 90;
    const planName = productId === 'fixed_30' ? 'Fundo de Investimento 30 Dias' : productId === 'fixed_60' ? 'Fundo de Investimento 60 Dias' : 'Fundo de Investimento 90 Dias';

    const buyDate = new Date(db.simulatedTime);
    const maturityDate = new Date(buyDate.getTime() + days * 24 * 60 * 60 * 1000);

    const newInvestment: Investment = {
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      phone,
      productType: productId as 'fixed_30' | 'fixed_60' | 'fixed_90',
      productId: productId,
      name: planName,
      amount: investAmount,
      dailyProfit: 0, // Não tem pagamento diário
      totalProfitEarned: 0,
      createdAt: db.simulatedTime,
      lastPayoutAt: db.simulatedTime,
      status: 'active', // Fundo a prazo começa ativo e trancado
      maturityAt: maturityDate.toISOString()
    };

    db.investments.push(newInvestment);
    writeSecurityLog(db, phone, `INVESTMENT_BUY_${productId.toUpperCase()}`, `Investimento em ${planName} ativado. Valor: ${investAmount} Kz. Vencimento em: ${maturityDate.toISOString()}`);

    // --- CÁLCULO DE COMISSÕES DE AFILIADOS EM 3 NÍVEIS PARA O FUNDO ("GRATIFICAÇÃO") ---
    let currentReferrerPhone = user.referredBy;
    // Nível 1
    if (currentReferrerPhone && db.users[currentReferrerPhone]) {
      const ref1 = db.users[currentReferrerPhone];
      // Padrinho tem plano ativo?
      const hasActiveProduct1 = db.investments.some(inv => inv.phone === ref1.phone && inv.status === 'active');
      if (hasActiveProduct1) {
        const comm1Amount = Math.round(investAmount * 0.15);
        const comm1: Commission = {
          id: 'comm_' + Math.random().toString(36).substr(2, 9),
          referrerPhone: ref1.phone,
          referredPhone: phone,
          depositId: 'fund_' + newInvestment.id,
          level: 1,
          percentage: 15,
          amount: comm1Amount,
          status: 'credited',
          createdAt: db.simulatedTime
        };
        db.commissions.push(comm1);
        ref1.balance += comm1Amount; // Credita imediato
        writeSecurityLog(db, ref1.phone, 'AFFILIATE_COMMISSION_L1', `Bónus de 15% recebido pela ativação do fundo de ${user.name} (${user.phone}). Valor: ${comm1Amount} Kz.`);
      } else {
        writeSecurityLog(db, ref1.phone, 'AFFILIATE_COMMISSION_BLOCKED_L1', `Bónus de comissão de 1º nível pelo fundo de ${user.name} bloqueado porque o padrinho não tem nenhum plano de investimento ativo.`);
      }

      // Nível 2
      const level2ReferrerPhone = ref1.referredBy;
      if (level2ReferrerPhone && db.users[level2ReferrerPhone]) {
        const ref2 = db.users[level2ReferrerPhone];
        const hasActiveProduct2 = db.investments.some(inv => inv.phone === ref2.phone && inv.status === 'active');
        if (hasActiveProduct2) {
          const comm2Amount = Math.round(investAmount * 0.10);
          const comm2: Commission = {
            id: 'comm_' + Math.random().toString(36).substr(2, 9),
            referrerPhone: ref2.phone,
            referredPhone: phone,
            depositId: 'fund_' + newInvestment.id,
            level: 2,
            percentage: 10,
            amount: comm2Amount,
            status: 'credited',
            createdAt: db.simulatedTime
          };
          db.commissions.push(comm2);
          ref2.balance += comm2Amount;
          writeSecurityLog(db, ref2.phone, 'AFFILIATE_COMMISSION_L2', `Bónus de 10% de 2º nível pelo fundo de ${user.name} recebido. Valor: ${comm2Amount} Kz.`);
        } else {
          writeSecurityLog(db, ref2.phone, 'AFFILIATE_COMMISSION_BLOCKED_L2', `Bónus de comissão de 2º nível pelo fundo de ${user.name} bloqueado porque o padrinho não tem nenhum plano de investimento ativo.`);
        }

        // Nível 3
        const level3ReferrerPhone = ref2.referredBy;
        if (level3ReferrerPhone && db.users[level3ReferrerPhone]) {
          const ref3 = db.users[level3ReferrerPhone];
          const hasActiveProduct3 = db.investments.some(inv => inv.phone === ref3.phone && inv.status === 'active');
          if (hasActiveProduct3) {
            const comm3Amount = Math.round(investAmount * 0.05);
            const comm3: Commission = {
              id: 'comm_' + Math.random().toString(36).substr(2, 9),
              referrerPhone: ref3.phone,
              referredPhone: phone,
              depositId: 'fund_' + newInvestment.id,
              level: 3,
              percentage: 5,
              amount: comm3Amount,
              status: 'credited',
              createdAt: db.simulatedTime
            };
            db.commissions.push(comm3);
            ref3.balance += comm3Amount;
            writeSecurityLog(db, ref3.phone, 'AFFILIATE_COMMISSION_L3', `Bónus de 5% de 3º nível pelo fundo de ${user.name} recebido. Valor: ${comm3Amount} Kz.`);
          } else {
            writeSecurityLog(db, ref3.phone, 'AFFILIATE_COMMISSION_BLOCKED_L3', `Bónus de comissão de 3º nível pelo fundo de ${user.name} bloqueado porque o padrinho não tem nenhum plano de investimento ativo.`);
          }
        }
      }
    }

    saveDb(db);

    return res.json({ message: `Investimento em ${planName} ativado com sucesso! Capital trancado por ${days} dias.`, investment: newInvestment });
  } else {
    // Produtos AO (Rendimento Diário)
    const prodConfig = PRODUCTS_AO_CONFIG.find(p => p.id === productId);
    if (!prodConfig) {
      return res.status(400).json({ error: 'Produto de investimento selecionado inválido.' });
    }

    if (user.balance < prodConfig.aporte) {
      return res.status(400).json({ error: `Saldo insuficiente para adquirir o plano ${prodConfig.name}. Valor necessário: ${prodConfig.aporte} Kz.` });
    }

    // Deduzir do saldo
    user.balance -= prodConfig.aporte;
    user.totalInvested += prodConfig.aporte;

    const newInvestment: Investment = {
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      phone,
      productType: 'daily',
      productId: prodConfig.id,
      name: `Plano ${prodConfig.name}`,
      amount: prodConfig.aporte,
      dailyProfit: prodConfig.dailyReturn,
      totalProfitEarned: 0,
      createdAt: db.simulatedTime,
      lastPayoutAt: db.simulatedTime,
      status: 'active', // Ativação automática e imediata do produto comprado
      maturityAt: null // Vitalício enquanto ativo
    };

    db.investments.push(newInvestment);
    writeSecurityLog(db, phone, 'INVESTMENT_BUY_DAILY_ACTIVE', `Plano ${prodConfig.name} comprado e ativado automaticamente.`);
    saveDb(db);

    return res.json({ message: `Plano ${prodConfig.name} comprado e ativado com sucesso! Começará a render de forma automática e já está totalmente funcional.`, investment: newInvestment });
  }
});

// 6. Políticas e Regras de Levantamento (Saque)
app.post('/api/withdrawals/create', (req, res) => {
  const db = loadDb();
  const { phone, amount, bankName, accountHolder, iban } = req.body;

  if (!phone || !amount || !bankName || !accountHolder || !iban) {
    return res.status(400).json({ error: 'Preencha todos os dados bancários.' });
  }

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const withdrawAmount = Number(amount);
  const isAdmin = user.role === 'admin' || user.phone === '942691403';

  if (!isAdmin) {
    // Limites Financeiros por Transação
    if (withdrawAmount < 3000) {
      return res.status(400).json({ error: 'O valor mínimo de levantamento permitido é de 3.000 Kz.' });
    }
    if (withdrawAmount > 50000) {
      return res.status(400).json({ error: 'O valor máximo de levantamento por transação é de 50.000 Kz.' });
    }

    // Janela de Atendimento Operacional sincronizada com o horário e fuso de Angola (WAT, UTC+1 / Africa/Luanda)
    // Usando formatação regional de data/hora robusta para determinar a hora local exata na simulação
    const angolaString = new Date(db.simulatedTime).toLocaleString('en-US', { timeZone: 'Africa/Luanda' });
    const angolaDate = new Date(angolaString);
    const hour = angolaDate.getHours();
    const dayOfWeek = angolaDate.getDay(); // 0 = Domingo, 6 = Sábado

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({
        error: 'Os levantamentos estão indisponíveis aos sábados e domingos. Por favor, tente novamente de segunda a sexta-feira, das 10:00h às 16:00h.'
      });
    }

    const isWorkingHours = hour >= 10 && hour < 16;

    if (!isWorkingHours) {
      return res.status(400).json({ 
        error: `Fora da janela operacional. Os levantamentos devem ser solicitados entre as 10:00h e as 16:00h do fuso horário de Angola. (Hora atual em Angola: ${hour.toString().padStart(2, '0')}:00h)` 
      });
    }

    if (user.balance < withdrawAmount) {
      return res.status(400).json({ error: 'Saldo disponível insuficiente para realizar este levantamento.' });
    }
  }

  // Deduzir imediatamente do saldo (trancar o valor)
  user.balance -= withdrawAmount;

  const fee = Math.round(withdrawAmount * 0.15);
  const netAmount = withdrawAmount - fee;

  const withdrawalId = 'with_' + Math.random().toString(36).substr(2, 9);
  const newWithdrawal: Withdrawal = {
    id: withdrawalId,
    phone,
    amount: withdrawAmount,
    fee,
    netAmount,
    bankName,
    accountHolder,
    iban,
    status: 'pending',
    createdAt: db.simulatedTime
  };

  db.withdrawals.push(newWithdrawal);
  writeSecurityLog(db, phone, 'WITHDRAWAL_SUBMITTED', `Solicitação de saque de ${withdrawAmount} Kz submetida (Taxa 15%: ${fee} Kz, Líquido: ${netAmount} Kz). Banco: ${bankName}. IBAN: ${iban}`);
  saveDb(db);

  res.json({ 
    message: `Solicitação de levantamento efetuada com sucesso! Valor bruto: ${withdrawAmount} Kz, Desconto de 15%: ${fee} Kz, Valor Líquido a receber: ${netAmount} Kz. Prazo de execução: 24 a 48 horas úteis.`, 
    withdrawal: newWithdrawal 
  });
});

// 7. Listar Transações do Usuário (Extrato Completo)
app.get('/api/user/transactions/:phone', (req, res) => {
  const db = loadDb();
  const { phone } = req.params;

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const deposits = db.deposits.filter(d => d.phone === phone);
  const withdrawals = db.withdrawals.filter(w => w.phone === phone);
  const commissions = db.commissions.filter(c => c.referrerPhone === phone);
  const profits = db.profitLogs.filter(p => p.phone === phone);
  const investments = db.investments.filter(i => i.phone === phone);

  // Mapear transações unificadas
  const transactions: any[] = [];

  deposits.forEach(d => {
    transactions.push({
      id: d.id,
      type: 'DEPÓSITO',
      amount: d.amount,
      status: d.status,
      details: `${d.provider} (${d.method === 'reference' ? 'Referência' : d.method === 'crypto' ? 'Cripto' : 'IBAN'})${d.transactionId ? ` | ID Ref: ${d.transactionId}` : ''}`,
      createdAt: d.createdAt
    });
  });

  withdrawals.forEach(w => {
    const fee = w.fee || Math.round(w.amount * 0.15);
    const netAmount = w.netAmount || (w.amount - fee);
    transactions.push({
      id: w.id,
      type: 'LEVANTAMENTO',
      amount: -w.amount,
      status: w.status,
      details: `Banco: ${w.bankName} | ${w.accountHolder} | Taxa 15%: -${fee} Kz | Líquido: ${netAmount} Kz`,
      createdAt: w.createdAt
    });
  });

  commissions.forEach(c => {
    transactions.push({
      id: c.id,
      type: 'COMISSÃO AFILIADO',
      amount: c.amount,
      status: c.status === 'credited' ? 'approved' : 'rejected',
      details: `${c.level}º Nível - Indicado: ${c.referredPhone}`,
      createdAt: c.createdAt
    });
  });

  profits.forEach(p => {
    const inv = db.investments.find(i => i.id === p.investmentId);
    transactions.push({
      id: p.id,
      type: 'RENDIMENTO',
      amount: p.amount,
      status: 'approved',
      details: inv ? inv.name : 'Motor Financeiro',
      createdAt: p.createdAt
    });
  });

  // Ordenar por data decrescente
  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    transactions,
    totals: {
      balance: user.balance,
      totalInvested: user.totalInvested,
      totalEarnings: user.totalEarnings
    }
  });
});

// --- PAINEL DE CONTROLE ADMINISTRATIVO & SIMULAÇÃO ---

// 8. Obter Todos os Dados (Para a Interface Administrativa)
app.get('/api/admin/all', (req, res) => {
  const db = loadDb();
  res.json({
    users: Object.values(db.users).map(({ passwordHash, ...u }) => u),
    investments: db.investments,
    deposits: db.deposits,
    withdrawals: db.withdrawals,
    commissions: db.commissions,
    profitLogs: db.profitLogs,
    securityLogs: db.securityLogs,
    recoveryRequests: db.recoveryRequests || [],
    simulatedTime: db.simulatedTime,
    autoProfitPayout: db.autoProfitPayout,
    giftCodes: db.giftCodes || []
  });
});

// 9. Ação de Depósito (Aprovar / Rejeitar com Comissões de Afiliados)
app.post('/api/admin/deposit/action', (req, res) => {
  const db = loadDb();
  const { depositId, action } = req.body; // action: 'approve' | 'reject'

  const deposit = db.deposits.find(d => d.id === depositId);
  if (!deposit) {
    return res.status(404).json({ error: 'Depósito não encontrado.' });
  }

  if (deposit.status !== 'pending') {
    return res.status(400).json({ error: 'Este depósito já foi processado anteriormente.' });
  }

  const client = db.users[deposit.phone];
  if (!client) {
    return res.status(404).json({ error: 'Usuário do depósito não encontrado.' });
  }

  if (action === 'approve') {
    deposit.status = 'approved';
    deposit.processedAt = db.simulatedTime;
    
    // Credita o saldo disponível do cliente
    client.balance += deposit.amount;
    writeSecurityLog(db, client.phone, 'DEPOSIT_APPROVED', `Depósito de ${deposit.amount} Kz aprovado pelo administrador.`);

    // --- CÁLCULO DE COMISSÕES DE AFILIADOS EM 3 NÍVEIS ---
    // 1º Nível (Indicação Direta): 15%
    // 2º Nível (Convidado do seu indicado): 10%
    // 3º Nível (Indicado do 2º nível): 5%
    // Comissões incidem sobre o valor inicial depositado do convidado.
    
    let currentReferrerPhone = client.referredBy;
    
    // Nível 1
    if (currentReferrerPhone && db.users[currentReferrerPhone]) {
      const ref1 = db.users[currentReferrerPhone];
      
      // Regra Especial de Rede: O convidado (padrinho) só ganha comissão se ele tiver um produto também ativo
      const hasActiveProduct1 = db.investments.some(inv => inv.phone === ref1.phone && inv.status === 'active');
      
      if (hasActiveProduct1) {
        const comm1Amount = Math.round(deposit.amount * 0.15);
        
        const comm1: Commission = {
          id: 'comm_' + Math.random().toString(36).substr(2, 9),
          referrerPhone: ref1.phone,
          referredPhone: client.phone,
          depositId: deposit.id,
          level: 1,
          percentage: 15,
          amount: comm1Amount,
          status: 'credited',
          createdAt: db.simulatedTime
        };
        db.commissions.push(comm1);
        ref1.balance += comm1Amount; // Credita imediato
        writeSecurityLog(db, ref1.phone, 'AFFILIATE_COMMISSION_L1', `Bónus de 15% recebido pelo depósito de ${client.name} (${client.phone}). Valor: ${comm1Amount} Kz.`);
      } else {
        writeSecurityLog(db, ref1.phone, 'AFFILIATE_COMMISSION_BLOCKED_L1', `Bónus de comissão de 1º nível bloqueado porque o padrinho não tem nenhum plano de investimento ativo.`);
      }

      // Nível 2
      const level2ReferrerPhone = ref1.referredBy;
      if (level2ReferrerPhone && db.users[level2ReferrerPhone]) {
        const ref2 = db.users[level2ReferrerPhone];
        
        // Regra Especial de Rede: O padrinho L2 só ganha comissão se ele tiver um produto também ativo
        const hasActiveProduct2 = db.investments.some(inv => inv.phone === ref2.phone && inv.status === 'active');
        
        if (hasActiveProduct2) {
          const comm2Amount = Math.round(deposit.amount * 0.10);
          
          const comm2: Commission = {
            id: 'comm_' + Math.random().toString(36).substr(2, 9),
            referrerPhone: ref2.phone,
            referredPhone: client.phone,
            depositId: deposit.id,
            level: 2,
            percentage: 10,
            amount: comm2Amount,
            status: 'credited',
            createdAt: db.simulatedTime
          };
          db.commissions.push(comm2);
          ref2.balance += comm2Amount; // Credita imediato
          writeSecurityLog(db, ref2.phone, 'AFFILIATE_COMMISSION_L2', `Bónus de 10% de 2º nível recebido. Valor: ${comm2Amount} Kz.`);
        } else {
          writeSecurityLog(db, ref2.phone, 'AFFILIATE_COMMISSION_BLOCKED_L2', `Bónus de comissão de 2º nível bloqueado porque o padrinho não tem nenhum plano de investimento ativo.`);
        }

        // Nível 3
        const level3ReferrerPhone = ref2.referredBy;
        if (level3ReferrerPhone && db.users[level3ReferrerPhone]) {
          const ref3 = db.users[level3ReferrerPhone];
          
          // Regra Especial de Rede: O padrinho L3 só ganha comissão se ele tiver um produto também ativo
          const hasActiveProduct3 = db.investments.some(inv => inv.phone === ref3.phone && inv.status === 'active');
          
          if (hasActiveProduct3) {
            const comm3Amount = Math.round(deposit.amount * 0.05);
            
            const comm3: Commission = {
              id: 'comm_' + Math.random().toString(36).substr(2, 9),
              referrerPhone: ref3.phone,
              referredPhone: client.phone,
              depositId: deposit.id,
              level: 3,
              percentage: 5,
              amount: comm3Amount,
              status: 'credited',
              createdAt: db.simulatedTime
            };
            db.commissions.push(comm3);
            ref3.balance += comm3Amount; // Credita imediato
            writeSecurityLog(db, ref3.phone, 'AFFILIATE_COMMISSION_L3', `Bónus de 5% de 3º nível recebido. Valor: ${comm3Amount} Kz.`);
          } else {
            writeSecurityLog(db, ref3.phone, 'AFFILIATE_COMMISSION_BLOCKED_L3', `Bónus de comissão de 3º nível bloqueado porque o padrinho não tem nenhum plano de investimento ativo.`);
          }
        }
      }
    }
  } else {
    deposit.status = 'rejected';
    deposit.processedAt = db.simulatedTime;
    writeSecurityLog(db, client.phone, 'DEPOSIT_REJECTED', `Depósito de ${deposit.amount} Kz rejeitado pelo administrador.`);
  }

  saveDb(db);
  res.json({ message: `Depósito ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`, deposit });
});

// 10. Ação de Reembolso de Depósito (Para testar reversão/remover comissões do cenário de teste)
app.post('/api/admin/deposit/refund', (req, res) => {
  const db = loadDb();
  const { depositId } = req.body;

  const deposit = db.deposits.find(d => d.id === depositId);
  if (!deposit || deposit.status !== 'approved') {
    return res.status(404).json({ error: 'Depósito aprovado correspondente não encontrado.' });
  }

  const client = db.users[deposit.phone];
  if (!client) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Deduzir o depósito reembolsado do cliente
  client.balance -= deposit.amount;
  deposit.status = 'rejected';
  writeSecurityLog(db, client.phone, 'DEPOSIT_REFUNDED', `Reembolso acionado! Valor deduzido: ${deposit.amount} Kz.`);

  // Reverter comissões geradas por este depósito
  const relatedCommissions = db.commissions.filter(c => c.depositId === depositId && c.status === 'credited');
  relatedCommissions.forEach(comm => {
    comm.status = 'refunded';
    const referrer = db.users[comm.referrerPhone];
    if (referrer) {
      referrer.balance -= comm.amount; // Dedução imediata
      writeSecurityLog(db, referrer.phone, 'COMMISSION_REVERTED', `Comissão de ${comm.amount} Kz revertida devido a reembolso do convidado.`);
    }
  });

  saveDb(db);
  res.json({ message: 'Depósito reembolsado e comissões revertidas de imediato!', deposit });
});

// 11. Ação de Levantamento (Aprovar / Rejeitar com devolução de capital)
app.post('/api/admin/withdrawal/action', (req, res) => {
  const db = loadDb();
  const { withdrawalId, action } = req.body; // 'approve' | 'reject'

  const withdrawal = db.withdrawals.find(w => w.id === withdrawalId);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Levantamento não encontrado.' });
  }

  if (withdrawal.status !== 'pending') {
    return res.status(400).json({ error: 'Este levantamento já foi processado.' });
  }

  const client = db.users[withdrawal.phone];
  if (!client) {
    return res.status(404).json({ error: 'Usuário do levantamento não encontrado.' });
  }

  if (action === 'approve') {
    withdrawal.status = 'approved';
    withdrawal.processedAt = db.simulatedTime;
    writeSecurityLog(db, client.phone, 'WITHDRAWAL_APPROVED', `Levantamento de ${withdrawal.amount} Kz aprovado.`);
  } else {
    withdrawal.status = 'rejected';
    withdrawal.processedAt = db.simulatedTime;
    
    // Devolver saldo ao utilizador
    client.balance += withdrawal.amount;
    writeSecurityLog(db, client.phone, 'WITHDRAWAL_REJECTED', `Levantamento de ${withdrawal.amount} Kz rejeitado. Valor devolvido ao saldo disponível.`);
  }

  saveDb(db);
  res.json({ message: `Levantamento ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`, withdrawal });
});

// 12. Ativar / Pausar Plano AO (Rendimento Diário) pelo Administrador
app.post('/api/admin/investment/action', (req, res) => {
  const db = loadDb();
  const { investmentId, action } = req.body; // 'activate' | 'pause' | 'resume'

  const investment = db.investments.find(i => i.id === investmentId);
  if (!investment) {
    return res.status(404).json({ error: 'Investimento não encontrado.' });
  }

  if (action === 'activate') {
    investment.status = 'active';
    investment.lastPayoutAt = db.simulatedTime; // Começa contagem a partir de agora
    writeSecurityLog(db, investment.phone, 'INVESTMENT_ACTIVATED', `Plano ${investment.name} foi ativado manualmente pelo administrador.`);
  } else if (action === 'pause') {
    investment.status = 'paused';
    writeSecurityLog(db, investment.phone, 'INVESTMENT_PAUSED', `Plano ${investment.name} foi pausado manualmente. Rendimentos cessaram.`);
  } else if (action === 'resume') {
    investment.status = 'active';
    investment.lastPayoutAt = db.simulatedTime;
    writeSecurityLog(db, investment.phone, 'INVESTMENT_RESUMED', `Plano ${investment.name} foi retomado.`);
  }

  saveDb(db);
  res.json({ message: `Plano alterado para ${investment.status} com sucesso!`, investment });
});

// 13. Bloquear / Desbloquear Utilizador (Administrativo)
app.post('/api/admin/user/toggle-status', (req, res) => {
  const db = loadDb();
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
  }

  if (phone === '942691403') {
    return res.status(400).json({ error: 'Não é possível alterar o estado do administrador mestre do sistema.' });
  }

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }

  const oldStatus = user.status;
  const newStatus = oldStatus === 'blocked' ? 'active' : 'blocked';
  user.status = newStatus;

  writeSecurityLog(db, '942691403', newStatus === 'blocked' ? 'USER_BLOCKED' : 'USER_UNBLOCKED', `O utilizador ${user.name} (${phone}) foi ${newStatus === 'blocked' ? 'suspenso/bloqueado' : 'desbloqueado/ativado'} pelo Administrador.`);

  saveDb(db);
  res.json({ message: `Utilizador ${user.name} foi ${newStatus === 'blocked' ? 'suspenso' : 'desbloqueado'} com sucesso!`, status: newStatus });
});

// 14. Excluir / Remover Utilizador (Administrativo)
app.post('/api/admin/user/delete', (req, res) => {
  const db = loadDb();
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
  }

  if (phone === '942691403') {
    return res.status(400).json({ error: 'Não é possível excluir o administrador mestre do sistema.' });
  }

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }

  const name = user.name;
  writeSecurityLog(db, '942691403', 'USER_DELETED', `Utilizador ${name} (${phone}) foi excluído definitivamente do sistema pelo Administrador.`);

  // Remover usuário
  delete db.users[phone];

  // Remover recursos associados para manter o banco limpo e consistente
  db.deposits = db.deposits.filter(d => d.phone !== phone);
  db.withdrawals = db.withdrawals.filter(w => w.phone !== phone);
  db.investments = db.investments.filter(i => i.phone !== phone);
  db.commissions = db.commissions.filter(c => c.referrerPhone !== phone && c.referredPhone !== phone);
  db.profitLogs = db.profitLogs.filter(p => p.phone !== phone);

  saveDb(db);
  res.json({ message: `Utilizador ${name} e todos os seus dados foram excluídos definitivamente com sucesso!` });
});

// 14a. Solicitar Recuperação de Conta (Público)
app.post('/api/auth/recover', (req, res) => {
  const db = loadDb();
  const { phone } = req.body;
  const formattedPhone = phone?.trim().replace(/\s+/g, '');
  
  if (!formattedPhone) {
    return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
  }
  
  const user = db.users[formattedPhone];
  if (!user) {
    return res.status(404).json({ error: 'Nenhum utilizador registado com este número de telefone.' });
  }
  
  // Evitar duplicados pendentes
  const existing = db.recoveryRequests.find(r => r.phone === formattedPhone && r.status === 'pending');
  if (existing) {
    return res.json({ message: 'Já existe um pedido de recuperação pendente para este número. Por favor, contacte o administrador.' });
  }
  
  const newRequest: RecoveryRequest = {
    id: 'rec_' + Math.random().toString(36).substr(2, 9),
    phone: formattedPhone,
    name: user.name,
    status: 'pending',
    createdAt: db.simulatedTime
  };
  
  db.recoveryRequests.push(newRequest);
  writeSecurityLog(db, formattedPhone, 'RECOVERY_REQUESTED', `Pedido de recuperação de conta iniciado para ${user.name} (${formattedPhone}).`);
  saveDb(db);
  
  res.json({ message: 'Pedido de recuperação enviado com sucesso ao administrador! Por favor, aguarde que o administrador redefina as suas credenciais.' });
});

// 14b. Redefinir Palavra-passe de Utilizador (Administrativo)
app.post('/api/admin/user/reset-password', (req, res) => {
  const db = loadDb();
  const { phone, newPassword } = req.body;
  
  if (!phone || !newPassword) {
    return res.status(400).json({ error: 'Telefone e nova palavra-passe são obrigatórios.' });
  }
  
  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }
  
  user.passwordHash = hashPassword(newPassword);
  user.failedAttempts = 0;
  user.lockoutUntil = null;
  
  // Atualizar pedidos de recuperação pendentes para resolvidos
  db.recoveryRequests.forEach(r => {
    if (r.phone === phone && r.status === 'pending') {
      r.status = 'resolved';
      r.resolvedAt = db.simulatedTime;
      r.newPasswordTemp = newPassword;
    }
  });
  
  writeSecurityLog(db, '942691403', 'USER_PASSWORD_RESET', `Administrador redefiniu a palavra-passe do utilizador ${user.name} (${phone}). Nova senha definida.`);
  saveDb(db);
  
  res.json({ message: `Palavra-passe do utilizador ${user.name} redefinida com sucesso para: ${newPassword}` });
});

// 14c. Editar Saldo, Lucros e Investimento Total de Utilizador (Administrativo)
app.post('/api/admin/user/edit-profit', (req, res) => {
  const db = loadDb();
  const { phone, balance, totalEarnings, totalInvested } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
  }
  
  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }
  
  const oldBalance = user.balance;
  const oldEarnings = user.totalEarnings;
  const oldInvested = user.totalInvested;
  
  if (balance !== undefined) user.balance = Number(balance);
  if (totalEarnings !== undefined) user.totalEarnings = Number(totalEarnings);
  if (totalInvested !== undefined) user.totalInvested = Number(totalInvested);
  
  writeSecurityLog(db, '942691403', 'USER_PROFIT_EDITED', `Saldo e lucros de ${user.name} (${phone}) editados. Saldo: ${oldBalance} Kz -> ${user.balance} Kz | Lucros: ${oldEarnings} Kz -> ${user.totalEarnings} Kz.`);
  saveDb(db);
  
  res.json({ message: 'Dados e lucros do utilizador editados com sucesso!', user });
});

// 14d. Pagamento Manual de Lucro Diário (Administrativo)
app.post('/api/admin/investment/pay-manual', (req, res) => {
  const db = loadDb();
  const { investmentId, amount } = req.body;
  const payAmount = Number(amount);
  
  if (!investmentId || isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ error: 'ID do investimento e valor válido de rendimento são obrigatórios.' });
  }
  
  const inv = db.investments.find(i => i.id === investmentId);
  if (!inv) {
    return res.status(404).json({ error: 'Investimento não encontrado.' });
  }
  
  const client = db.users[inv.phone];
  if (!client) {
    return res.status(404).json({ error: 'Utilizador proprietário não encontrado.' });
  }
  
  client.balance += payAmount;
  client.totalEarnings += payAmount;
  inv.totalProfitEarned += payAmount;
  inv.lastPayoutAt = db.simulatedTime;
  
  const profitLog: ProfitLog = {
    id: 'prof_' + Math.random().toString(36).substr(2, 9),
    phone: inv.phone,
    investmentId: inv.id,
    amount: payAmount,
    createdAt: db.simulatedTime
  };
  db.profitLogs.push(profitLog);
  
  writeSecurityLog(db, inv.phone, 'MANUAL_PROFIT_CREDITED', `Creditado rendimento MANUAL de ${payAmount} Kz para ${inv.name} (Inv ID: ${inv.id}) pelo Administrador.`);
  saveDb(db);
  
  res.json({ message: `Rendimento manual de ${payAmount} Kz pago com sucesso para o investimento de ${client.name}!`, investment: inv });
});

// 14e. Pagamento Automático em Lote para Todos os Investimentos Diários Ativos (Administrativo)
app.post('/api/admin/investment/pay-automatic', (req, res) => {
  const db = loadDb();
  let count = 0;
  let totalPaid = 0;
  
  db.investments.forEach(inv => {
    if (inv.productType === 'daily' && inv.status === 'active') {
      const client = db.users[inv.phone];
      if (client && client.status === 'active') {
        client.balance += inv.dailyProfit;
        client.totalEarnings += inv.dailyProfit;
        inv.totalProfitEarned += inv.dailyProfit;
        inv.lastPayoutAt = db.simulatedTime;
        
        const profitLog: ProfitLog = {
          id: 'prof_' + Math.random().toString(36).substr(2, 9),
          phone: inv.phone,
          investmentId: inv.id,
          amount: inv.dailyProfit,
          createdAt: db.simulatedTime
        };
        db.profitLogs.push(profitLog);
        
        count++;
        totalPaid += inv.dailyProfit;
        writeSecurityLog(db, inv.phone, 'DAILY_PROFIT_CREDITED', `Creditado rendimento diário AUTOMÁTICO de ${inv.dailyProfit} Kz para ${inv.name} (Inv ID: ${inv.id}).`);
      }
    }
  });
  
  writeSecurityLog(db, '942691403', 'BATCH_PROFIT_PAYOUT', `Executado pagamento automático em lote de lucros diários. Investimentos pagos: ${count}. Total: ${totalPaid} Kz.`);
  saveDb(db);
  res.json({ message: `Pagamento automático em lote executado! Foram pagos lucros a ${count} investimentos ativos, totalizando ${totalPaid} Kz creditados.` });
});

// 14f. Alternar Pagamento de Rendimentos Automático em Segundo Plano (Administrativo)
app.post('/api/admin/toggle-auto-payout', (req, res) => {
  const db = loadDb();
  const { enabled } = req.body;
  
  db.autoProfitPayout = !!enabled;
  writeSecurityLog(db, '942691403', 'TOGGLE_AUTO_PROFIT_PAYOUT', `Modo de rendimento automático em segundo plano alterado para: ${db.autoProfitPayout ? 'ATIVO' : 'INATIVO'}.`);
  saveDb(db);
  
  res.json({ 
    message: `Pagamento automático de rendimento está agora ${db.autoProfitPayout ? 'ACTIVADO' : 'DESACTIVADO'}.`, 
    autoProfitPayout: db.autoProfitPayout 
  });
});

// --- SISTEMA DE CÓDIGOS DE PRESENTES (GIFT CODES) ---

// 14g. Listar todos os códigos de presentes (Administrativo)
app.get('/api/admin/gift-codes', (req, res) => {
  const db = loadDb();
  res.json({ giftCodes: db.giftCodes || [] });
});

// 14h. Criar um novo código de presente (Administrativo)
app.post('/api/admin/gift-codes', (req, res) => {
  const db = loadDb();
  let { code, amount, maxUses } = req.body;
  
  if (!code || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'O código e um valor de presente válido são obrigatórios.' });
  }

  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length < 3) {
    return res.status(400).json({ error: 'O código deve ter pelo menos 3 caracteres.' });
  }

  // Verificar se o código já existe
  const exists = db.giftCodes.some(gc => gc.code === cleanCode);
  if (exists) {
    return res.status(400).json({ error: 'Este código de presente já existe.' });
  }

  const newGift: GiftCode = {
    id: 'gift_' + Math.random().toString(36).substr(2, 9),
    code: cleanCode,
    amount: Number(amount),
    maxUses: Number(maxUses || 1),
    usesCount: 0,
    usedBy: [],
    createdAt: db.simulatedTime,
    createdBy: '942691403', // Admin mestre
    status: 'active'
  };

  db.giftCodes.push(newGift);
  writeSecurityLog(db, '942691403', 'GIFT_CODE_CREATED', `Código de presente "${cleanCode}" no valor de ${amount} Kz criado (Máx usos: ${maxUses}).`);
  saveDb(db);

  res.json({ message: `Código de presente "${cleanCode}" criado com sucesso!`, giftCode: newGift });
});

// 14i. Eliminar um código de presente (Administrativo)
app.post('/api/admin/gift-codes/delete', (req, res) => {
  const db = loadDb();
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID do código de presente é obrigatório.' });
  }

  const giftIndex = db.giftCodes.findIndex(gc => gc.id === id);
  if (giftIndex === -1) {
    return res.status(404).json({ error: 'Código de presente não encontrado.' });
  }

  const gift = db.giftCodes[giftIndex];
  db.giftCodes.splice(giftIndex, 1);
  writeSecurityLog(db, '942691403', 'GIFT_CODE_DELETED', `Código de presente "${gift.code}" eliminado pelo administrador.`);
  saveDb(db);

  res.json({ message: `Código de presente "${gift.code}" eliminado com sucesso!` });
});

// 14j. Resgatar um código de presente (Utilizador)
app.post('/api/user/redeem-gift-code', (req, res) => {
  const db = loadDb();
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Número de telefone e código do presente são obrigatórios.' });
  }

  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Esta conta encontra-se suspensa.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const gift = db.giftCodes.find(gc => gc.code === cleanCode);

  if (!gift) {
    return res.status(404).json({ error: 'Código de presente inválido ou inexistente.' });
  }

  if (gift.status !== 'active') {
    return res.status(400).json({ error: 'Este código de presente já não está ativo.' });
  }

  // Verificar se o limite de utilizações foi atingido
  if (gift.usesCount >= gift.maxUses) {
    gift.status = 'inactive';
    saveDb(db);
    return res.status(400).json({ error: 'Este código de presente já atingiu o limite de utilizações.' });
  }

  // Verificar se o utilizador já usou este código de presente
  if (gift.usedBy.includes(phone)) {
    return res.status(400).json({ error: 'Você já resgatou este código de presente anteriormente.' });
  }

  // Aplicar prêmio
  const prizeAmount = gift.amount;
  user.balance += prizeAmount;
  
  // Registar utilização
  gift.usesCount += 1;
  gift.usedBy.push(phone);

  if (gift.usesCount >= gift.maxUses) {
    gift.status = 'inactive';
  }

  // Registar no log de segurança
  writeSecurityLog(db, phone, 'GIFT_CODE_REDEEMED', `Código de presente "${cleanCode}" resgatado com sucesso! Valor adicionado: ${prizeAmount} Kz.`);
  saveDb(db);

  const { passwordHash, ...safeUser } = user;
  res.json({ 
    message: `Sucesso! O código "${cleanCode}" foi resgatado e ${prizeAmount.toLocaleString('pt-AO')} Kz foram adicionados ao seu saldo disponível.`, 
    user: safeUser 
  });
});

// 15. Sincronização e Ajuste Cronológico do Servidor
// Retorna a hora oficial sincronizada com Angola em tempo real ou simula o avanço de tempo
app.post('/api/admin/simulate-time', (req, res) => {
  const db = loadDb();
  const days = Number(req.body.days || 0);

  if (days > 0) {
    const additionalMs = days * 24 * 60 * 60 * 1000;
    db.timeOffsetMs = (db.timeOffsetMs || 0) + additionalMs;
    
    // Recalcular simulatedTime com o novo offset
    const currentAngolaTime = getAngolaTimeISO();
    db.simulatedTime = new Date(new Date(currentAngolaTime).getTime() + db.timeOffsetMs).toISOString();
    
    writeSecurityLog(db, '942691403', 'TIME_SIMULATION_ADVANCED', `Simulador avançado em +${days} dia(s). Novo horário simulado: ${db.simulatedTime}`);
    saveDb(db);

    return res.json({
      message: `Tempo avançado com sucesso em +${days} dia(s)!`,
      simulatedTime: db.simulatedTime,
      timeOffsetMs: db.timeOffsetMs
    });
  }

  // Se days for 0 ou não enviado, apenas sincroniza/limpa offset para voltar ao tempo real
  db.timeOffsetMs = 0;
  const currentAngolaTime = getAngolaTimeISO();
  db.simulatedTime = currentAngolaTime;
  
  writeSecurityLog(db, '942691403', 'TIME_SIMULATION_RESET', `Simulador de tempo redefinido para o horário real de Angola.`);
  saveDb(db);

  res.json({
    message: `Horário do servidor sincronizado de volta ao tempo real de Angola (WAT, UTC+1).`,
    simulatedTime: db.simulatedTime,
    timeOffsetMs: db.timeOffsetMs
  });
});

// Loop de Pagamento de Rendimentos Automático e Maturação em Segundo Plano (Executa a cada 60 segundos)
setInterval(() => {
  try {
    const db = loadDb();
    if (!db.autoProfitPayout) return;

    let changed = false;
    const currentTime = new Date(db.simulatedTime).getTime();

    db.investments.forEach(inv => {
      // A. PAGAR RENDIMENTO DIÁRIO (Produtos AO1 a AO7)
      if (inv.productType === 'daily' && inv.status === 'active') {
        let lastPayoutTime = new Date(inv.lastPayoutAt || inv.createdAt).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // Loop para pagar todos os ciclos de 24 horas pendentes se o relógio pulou dias
        while (currentTime - lastPayoutTime >= oneDayMs) {
          const client = db.users[inv.phone];
          if (client && client.status === 'active') {
            client.balance += inv.dailyProfit;
            client.totalEarnings += inv.dailyProfit;
            inv.totalProfitEarned += inv.dailyProfit;
            
            // Avança para o próximo ciclo de pagamento
            lastPayoutTime += oneDayMs;
            inv.lastPayoutAt = new Date(lastPayoutTime).toISOString();

            const profitLog: ProfitLog = {
              id: 'prof_' + Math.random().toString(36).substr(2, 9),
              phone: inv.phone,
              investmentId: inv.id,
              amount: inv.dailyProfit,
              createdAt: inv.lastPayoutAt
            };
            db.profitLogs.push(profitLog);
            changed = true;

            writeSecurityLog(db, inv.phone, 'DAILY_PROFIT_CREDITED_AUTO_BG', `Rendimento automático em segundo plano creditado: +${inv.dailyProfit} Kz para ${inv.name}.`);
          } else {
            break;
          }
        }
      }

      // B. PROCESSAR MATURAÇÃO DE FUNDOS A PRAZO (30, 60 ou 90 Dias)
      if (inv.productType && inv.productType.startsWith('fixed_') && inv.status === 'active' && inv.maturityAt) {
        const maturityTime = new Date(inv.maturityAt).getTime();

        if (currentTime >= maturityTime) {
          const client = db.users[inv.phone];
          if (client) {
            // Rendimento atualizado conforme regras de prazos:
            // - 30 dias: 100% de Lucro Líquido
            // - 60 dias: 150% de Lucro Líquido
            // - 90 dias: 200% de Lucro Líquido
            let rate = 1.0;
            if (inv.productType === 'fixed_60') {
              rate = 1.5;
            } else if (inv.productType === 'fixed_90') {
              rate = 2.0;
            }
            const accumulatedProfit = Math.round(inv.amount * rate);
            const totalRelease = inv.amount + accumulatedProfit;

            // Liberta capital inicial + lucro acumulado
            client.balance += totalRelease;
            client.totalEarnings += accumulatedProfit;
            client.totalInvested -= inv.amount;

            inv.status = 'matured';
            inv.totalProfitEarned = accumulatedProfit;

            // Gravar logs de lucro acumulado
            const profitLog: ProfitLog = {
              id: 'prof_' + Math.random().toString(36).substr(2, 9),
              phone: inv.phone,
              investmentId: inv.id,
              amount: accumulatedProfit,
              createdAt: db.simulatedTime
            };
            db.profitLogs.push(profitLog);
            changed = true;

            const daysText = inv.productType === 'fixed_30' ? '30 Dias' : inv.productType === 'fixed_60' ? '60 Dias' : '90 Dias';
            const ratePercent = rate * 100;
            writeSecurityLog(db, inv.phone, 'FIXED_MATURED_AUTO', `Fundo de Longo Prazo (${daysText}) atingiu maturidade! Liberado Capital Inicial (${inv.amount} Kz) + Lucro de ${ratePercent}% (${accumulatedProfit} Kz). Total Creditado: ${totalRelease} Kz.`);
          }
        }
      }
    });

    if (changed) {
      saveDb(db);
    }
  } catch (err) {
    console.error('Erro no processamento automático em segundo plano:', err);
  }
}, 60000);

// API para Download do Aplicativo Android (Simulado com payload real para download de APK funcional)
app.get('/api/app/download', (req, res) => {
  try {
    res.setHeader('Content-Disposition', 'attachment; filename=MoneyAO_v1.0.4.apk');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    
    // Pequeno arquivo de texto representando o APK para fins de protótipo de alta fidelidade
    const dummyApkContent = Buffer.from(
      'MoneyAO Android Application v1.0.4 - Angola Investment Management. ' +
      'Este é um aplicativo oficial simulado da plataforma de alta rentabilidade MoneyAO Angola.'
    );
    res.send(dummyApkContent);
  } catch (err) {
    console.error('Erro ao baixar APK:', err);
    res.status(500).json({ error: 'Erro ao gerar download do aplicativo.' });
  }
});

// --- ENVOLTÓRIO DO VITE / MIDDLEWARE E PRODUÇÃO ---

async function start() {
  // Carregar banco de dados durável do Firestore na inicialização do servidor
  try {
    await loadDbAsync();
    console.log('[Database] Banco de dados durável (Firestore) carregado com sucesso!');
  } catch (err) {
    console.error('[Database] Erro ao carregar banco de dados durável:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    // Desenvolvimento: Montar Vite em modo middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Produção: Servir estáticos do diretório dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MoneyAO] Servidor rodando em http://localhost:${PORT}`);
  });
}

start();
