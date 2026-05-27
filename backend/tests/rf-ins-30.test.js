// rf-ins-30.test.js
// =============================================
// Tests para RF-INS-30: Notificaciones por comentarios del admin
// =============================================
// Verifica que:
// 1. Agregar un mensaje al chat de la EP guarda el comentario en chatObservaciones.
// 2. Si el remitente es 'ADMIN' o 'Instructor', crea una notificación persistente para el Aprendiz.
// 3. Si el remitente es 'ADMIN', crea además una notificación para el Instructor asignado.
// 4. Si el remitente es 'Aprendiz', crea una notificación para el Instructor de seguimiento.
// =============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');
const productiveStagesService = require('../src/modules/productive-stages-dev2/productive-stages.service');
const Notification = require('../src/modules/system-config-dev1/Notification.model');
const User = require('../src/modules/users-dev1/user.model');

describe('RF-INS-30: Notificaciones por comentarios del admin', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe guardar el comentario en chatObservaciones y crear notificación para el Aprendiz cuando comenta el Admin', async () => {
    const apprenticeId = new mongoose.Types.ObjectId();
    const instructorId = new mongoose.Types.ObjectId();
    const stageId = new mongoose.Types.ObjectId();

    const mockStage = {
      _id: stageId,
      apprenticeId,
      chatObservaciones: [],
      observaciones: '',
      save: vi.fn().mockResolvedValue(true)
    };

    const mockApprentice = {
      _id: apprenticeId,
      name: 'Carlos Aprendiz',
      instructorAsignado: instructorId
    };

    // Spies y Mocks
    vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
    vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
    
    const spyNotificationCreate = vi.spyOn(Notification, 'create').mockResolvedValue({ _id: 'noti123' });

    // Ejecutar el servicio
    const result = await productiveStagesService.agregarMensajeChat(stageId, {
      remitente: 'ADMIN',
      texto: 'Esta es una observación importante del Administrador en el flujo.'
    });

    // 1. Verificar que se guarda en chatObservaciones
    expect(mockStage.chatObservaciones).toHaveLength(1);
    expect(mockStage.chatObservaciones[0]).toMatchObject({
      remitente: 'ADMIN',
      texto: 'Esta es una observación importante del Administrador en el flujo.'
    });

    // 2. Verificar que se guarda en observaciones del historial
    expect(mockStage.observaciones).toContain('ADMIN] Esta es una observación importante');

    // 3. Verificar que se crea la notificación para el Aprendiz
    expect(spyNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: apprenticeId,
        mensaje: expect.stringContaining('El Administrador ha dejado una observación en tu flujo'),
        tipo: 'INFO',
        referencia: stageId,
        referenciaModelo: 'ProductiveStage'
      })
    );

    // 4. Verificar que también se crea la notificación para el Instructor asignado (Seguimiento)
    expect(spyNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: instructorId,
        mensaje: expect.stringContaining('El Administrador ha dejado un comentario en el flujo de Carlos Aprendiz'),
        tipo: 'INFO',
        referencia: stageId,
        referenciaModelo: 'ProductiveStage'
      })
    );
  });

  it('debe notificar al Instructor de seguimiento cuando el Aprendiz comenta su flujo', async () => {
    const apprenticeId = new mongoose.Types.ObjectId();
    const instructorId = new mongoose.Types.ObjectId();
    const stageId = new mongoose.Types.ObjectId();

    const mockStage = {
      _id: stageId,
      apprenticeId,
      chatObservaciones: [],
      observaciones: '',
      save: vi.fn().mockResolvedValue(true)
    };

    const mockApprentice = {
      _id: apprenticeId,
      name: 'Carlos Aprendiz',
      instructorAsignado: instructorId
    };

    // Spies y Mocks
    vi.spyOn(ProductiveStage, 'findById').mockResolvedValue(mockStage);
    vi.spyOn(User, 'findById').mockResolvedValue(mockApprentice);
    
    const spyNotificationCreate = vi.spyOn(Notification, 'create').mockResolvedValue({ _id: 'noti456' });

    // Ejecutar el servicio
    await productiveStagesService.agregarMensajeChat(stageId, {
      remitente: 'Aprendiz',
      texto: 'Estimado instructor, ya corregí las firmas de mi bitácora.'
    });

    // Verificar que se crea la notificación para el Instructor de seguimiento
    expect(spyNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: instructorId,
        mensaje: expect.stringContaining('El aprendiz Carlos Aprendiz ha dejado un comentario en su flujo'),
        tipo: 'INFO',
        referencia: stageId,
        referenciaModelo: 'ProductiveStage'
      })
    );
  });
});
