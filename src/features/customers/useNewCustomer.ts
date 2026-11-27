import { useState } from 'react';
import { BusinessError, createCustomer } from '@/data/repo';
import { maskPhone } from '@/lib/format';
import type { Customer } from '@/types/domain';

/** Estado e validação do cadastro de cliente (nome + telefone) — usado no sheet rápido e na tela Novo cliente. */
export function useNewCustomer(onSaved: (c: Customer) => void) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = phone.replace(/\D/g, '').length;
  const phoneError = phone && digits < 10 ? 'Informe o telefone com DDD. Ex.: (61) 9 9999-0000' : undefined;
  const valid = name.trim().length > 0 && digits >= 10;
  const reason = !name.trim() ? 'Digite o nome do cliente.' : digits < 10 ? 'Digite o telefone com DDD.' : null;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true); setError(null);
    try {
      const c = await createCustomer({ name, phone });
      setName(''); setPhone('');
      onSaved(c);
    } catch (e) {
      setError(e instanceof BusinessError ? e.message : 'Não foi possível salvar o cliente. Tente de novo.');
    } finally { setBusy(false); }
  };

  return { name, setName, phone, setPhone: (s: string) => setPhone(maskPhone(s)), phoneError, valid, reason, busy, error, save };
}
