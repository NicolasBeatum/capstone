import path from 'node:path';
import { spawn } from 'node:child_process';
import { projectRoot, runtime } from './runtime.mjs';
const r=runtime(), port=Number(process.env.STUDENT_PREVIEW_PORT ?? 8089);
if (!Number.isInteger(port) || port<1024 || port>65535) throw Error('Puerto de previsualización inválido.');
const child=spawn(path.join(projectRoot,'node_modules/.bin/expo'), ['start','--clear','--localhost','--port',String(port),'--max-workers','2'], {
  cwd:projectRoot, stdio:'inherit', env:{...process.env,CI:'false',EXPO_NO_DOTENV:'1',EXPO_PUBLIC_SUPABASE_URL:r.API_URL,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:r.ANON_KEY},
});
child.on('error',()=>{console.error('No se pudo iniciar la previsualización local.');process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code ?? 1;});
