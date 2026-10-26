// Dados do seu projeto Supabase (no painel: Project Settings → API).
// Deixe em branco para usar o app só neste aparelho, sem login.
//
// A "anon key" é pública por natureza (vai para o navegador de qualquer jeito).
// Quem protege os dados são as regras de segurança (RLS) do arquivo supabase/schema.sql:
// cada pessoa só consegue ler e alterar os próprios dados.
window.BANCO_CONFIG = {
  supabaseUrl: '',      // ex: 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: '',  // ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'
};
