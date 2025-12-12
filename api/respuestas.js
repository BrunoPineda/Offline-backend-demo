import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getRespuestasByFormulario,
  getRespuestasByUsuario, 
  getRespuesta, 
  saveRespuesta,
  getMisRespuestas,
  getDashboardRespuestas,
  exportarRespuestasExcel
} from '../routes/respuestasController.js';

const router = express.Router();

// GET /respuestas/mis-respuestas - Obtener todas las respuestas del usuario actual
router.get('/mis-respuestas', authenticateToken, getMisRespuestas);

// GET /respuestas/formulario/:idFormulario/all - Obtener todas las respuestas de un formulario (para administradores)
router.get('/formulario/:idFormulario/all', authenticateToken, getRespuestasByFormulario);

// GET /respuestas/formulario/:idFormulario - Obtener respuestas de un formulario específico del usuario
router.get('/formulario/:idFormulario', authenticateToken, getRespuestasByUsuario);

// GET /respuestas/:idRespuesta - Obtener una respuesta específica con sus valores
router.get('/:idRespuesta', authenticateToken, getRespuesta);

// POST /respuestas/formulario/:idFormulario - Crear o actualizar una respuesta
router.post('/formulario/:idFormulario', authenticateToken, saveRespuesta);

// GET /respuestas/dashboard - Obtener dashboard de respuestas con estadísticas
router.get('/dashboard', authenticateToken, getDashboardRespuestas);

// GET /respuestas/export/excel - Exportar respuestas a Excel
router.get('/export/excel', authenticateToken, exportarRespuestasExcel);

export default router;

