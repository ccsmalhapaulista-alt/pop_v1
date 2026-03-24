import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { POP_CRITICALITY, POP_STATUS } from '../lib/constants';
import { createPopPlaceholder } from '../lib/placeholders';
import { useAuth } from '../contexts/AuthContext';
import { fetchCategories } from '../services/categoryService';
import { deletePopImage, fetchPopById, savePop, updatePopImage, uploadPopImage } from '../services/popService';

const initialForm = {
  titulo: '',
  categoria: '',
  subcategoria: '',
  criticidade: 'MEDIA',
  status: 'RASCUNHO',
  palavras_chave: '',
  o_que_e: '',
  principais_riscos: '',
  principais_evidencias: '',
  principais_causas: '',
  procedimento_agente: '',
  observacoes: '',
  imagem_capa_url: '',
};

function normalizeDisplayOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function PopEditorPage({ mode }) {
  const pendingImagesRef = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const nextMessage = location.state?.successMessage;
    if (!nextMessage) return;

    setSuccessMessage(nextMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const nextCategories = await fetchCategories();
        setCategories(nextCategories.filter((item) => item.ativo));

        if (mode === 'edit' && id) {
          const pop = await fetchPopById(id);
          setForm({
            id: pop.id,
            titulo: pop.titulo,
            categoria: pop.categoria,
            subcategoria: pop.subcategoria || '',
            criticidade: pop.criticidade,
            status: pop.status,
            palavras_chave: pop.palavras_chave || '',
            o_que_e: pop.o_que_e,
            principais_riscos: pop.principais_riscos,
            principais_evidencias: pop.principais_evidencias,
            principais_causas: pop.principais_causas,
            procedimento_agente: pop.procedimento_agente,
            observacoes: pop.observacoes || '',
            imagem_capa_url: pop.imagem_capa_url || '',
          });
          setExistingImages((pop.pop_imagens ?? []).sort((a, b) => a.ordem - b.ordem));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, mode]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const previewCover = useMemo(() => {
    return (
      existingImages.find((image) => image.is_capa)?.signed_url ||
      existingImages.find((image) => image.is_capa)?.public_url ||
      existingImages[0]?.signed_url ||
      existingImages[0]?.public_url ||
      form.imagem_capa_url ||
      createPopPlaceholder(form.titulo, form.criticidade)
    );
  }, [existingImages, form.criticidade, form.imagem_capa_url, form.titulo]);

  function handleFieldChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleFileSelection(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const nextPending = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      legenda: '',
      ordem: normalizeDisplayOrder(existingImages.length + pendingImages.length + index + 1),
      is_capa: existingImages.length === 0 && index === 0,
    }));

    setPendingImages((current) => [...current, ...nextPending]);
  }

  function updatePendingImage(index, payload) {
    setPendingImages((current) =>
      current.map((image, currentIndex) => {
        if (payload.is_capa && currentIndex !== index) {
          return { ...image, is_capa: false };
        }

        return currentIndex === index ? { ...image, ...payload } : image;
      }),
    );
  }

  function removePendingImage(index) {
    setPendingImages((current) => {
      const removed = current[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function saveImages(popId) {
    const uploadedImages = [];

    try {
      for (const image of pendingImages) {
        const uploadedImage = await uploadPopImage(popId, image.file, {
          legenda: image.legenda,
          ordem: normalizeDisplayOrder(image.ordem),
          is_capa: false,
        });

        uploadedImages.push(uploadedImage);
      }

      const pendingCoverIndex = pendingImages.findIndex((image) => image.is_capa);
      if (pendingCoverIndex >= 0) {
        const existingCoverIds = existingImages.filter((image) => image.is_capa).map((image) => image.id);
        const uploadedCover = uploadedImages[pendingCoverIndex];

        for (const imageId of existingCoverIds) {
          await updatePopImage(imageId, { is_capa: false });
        }

        if (uploadedCover?.id) {
          await updatePopImage(uploadedCover.id, { is_capa: true });
        }
      } else if (!existingImages.length && uploadedImages[0]?.id) {
        await updatePopImage(uploadedImages[0].id, { is_capa: true });
      }
    } catch (error) {
      for (const uploadedImage of uploadedImages) {
        try {
          await deletePopImage(uploadedImage.id, uploadedImage.storage_path);
        } catch {
          // Best effort rollback to reduce orphaned records/files after partial failures.
        }
      }

      throw error;
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const savedPop = await savePop(form, profile.id);
      await saveImages(savedPop.id);
      setPendingImages([]);
      navigate(`/admin/pops/${savedPop.id}`, {
        replace: true,
        state: { successMessage: 'POP salvo com sucesso.' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExistingImageUpdate(imageId, payload) {
    try {
      if (payload.is_capa) {
        for (const image of existingImages.filter((item) => item.id !== imageId && item.is_capa)) {
          await updatePopImage(image.id, { is_capa: false });
        }
      }

      await updatePopImage(imageId, payload);
      if (id) {
        const pop = await fetchPopById(id);
        setExistingImages((pop.pop_imagens ?? []).sort((a, b) => a.ordem - b.ordem));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteExistingImage(image) {
    if (!window.confirm('Deseja excluir esta imagem?')) return;

    try {
      await deletePopImage(image.id, image.storage_path);
      const pop = await fetchPopById(id);
      setExistingImages((pop.pop_imagens ?? []).sort((a, b) => a.ordem - b.ordem));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <LoadingState message="Carregando POP..." />;
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Editor de POP</span>
          <h1>{mode === 'edit' ? 'Editar procedimento' : 'Novo procedimento'}</h1>
        </div>
        <Link className="button button-ghost" to="/admin/pops">
          Voltar
        </Link>
      </div>

      <form className="page-stack" onSubmit={handleSave}>
        <section className="panel">
          <div className="section-heading">
            <h2>Informacoes basicas</h2>
          </div>
          <div className="form-grid two-columns">
            <label className="field">
              <span>Titulo</span>
              <input value={form.titulo} onChange={(event) => handleFieldChange('titulo', event.target.value)} required />
            </label>

            <label className="field">
              <span>Categoria</span>
              <select value={form.categoria} onChange={(event) => handleFieldChange('categoria', event.target.value)} required>
                <option value="">Selecione</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.nome}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Subcategoria</span>
              <input value={form.subcategoria} onChange={(event) => handleFieldChange('subcategoria', event.target.value)} />
            </label>

            <label className="field">
              <span>Criticidade</span>
              <select value={form.criticidade} onChange={(event) => handleFieldChange('criticidade', event.target.value)}>
                {POP_CRITICALITY.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(event) => handleFieldChange('status', event.target.value)}>
                {POP_STATUS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Palavras-chave</span>
              <input
                value={form.palavras_chave}
                onChange={(event) => handleFieldChange('palavras_chave', event.target.value)}
                placeholder="Separadas por virgula"
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Imagens</h2>
          </div>
          <div className="image-editor-grid">
            <div className="cover-preview">
              <img src={previewCover} alt={form.titulo || 'Pre-visualizacao da capa'} />
              <span>Capa atual do procedimento</span>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Adicionar imagens</span>
                <input type="file" accept="image/*" multiple onChange={handleFileSelection} />
              </label>

              {existingImages.length > 0 ? (
                <div className="list-stack">
                  {existingImages.map((image) => (
                    <article key={image.id} className="image-list-row">
                      <img src={image.signed_url || image.public_url} alt={image.legenda || 'Imagem do POP'} />
                      <div className="image-row-fields">
                        <input
                          defaultValue={image.legenda || ''}
                          onBlur={(event) => handleExistingImageUpdate(image.id, { legenda: event.target.value })}
                          placeholder="Legenda"
                        />
                        <input
                          type="number"
                          defaultValue={image.ordem}
                          onBlur={(event) => handleExistingImageUpdate(image.id, { ordem: normalizeDisplayOrder(event.target.value) })}
                          min="1"
                        />
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={image.is_capa}
                            onChange={(event) => handleExistingImageUpdate(image.id, { is_capa: event.target.checked })}
                          />
                          <span>Imagem principal</span>
                        </label>
                        <button className="button button-secondary" type="button" onClick={() => handleDeleteExistingImage(image)}>
                          Excluir imagem
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {pendingImages.length > 0 ? (
                <div className="list-stack">
                  {pendingImages.map((image, index) => (
                    <article key={`${image.file.name}-${index}`} className="image-list-row">
                      <img src={image.preview} alt={image.file.name} />
                      <div className="image-row-fields">
                        <input
                          value={image.legenda}
                          onChange={(event) => updatePendingImage(index, { legenda: event.target.value })}
                          placeholder="Legenda"
                        />
                        <input
                          type="number"
                          value={image.ordem}
                          onChange={(event) => updatePendingImage(index, { ordem: normalizeDisplayOrder(event.target.value) })}
                          min="1"
                        />
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={image.is_capa}
                            onChange={(event) => updatePendingImage(index, { is_capa: event.target.checked })}
                          />
                          <span>Imagem principal</span>
                        </label>
                        <button className="button button-ghost" type="button" onClick={() => removePendingImage(index)}>
                          Remover
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Conteudo</h2>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>O que e</span>
              <textarea value={form.o_que_e} onChange={(event) => handleFieldChange('o_que_e', event.target.value)} rows="4" required />
            </label>

            <label className="field">
              <span>Principais riscos</span>
              <textarea
                value={form.principais_riscos}
                onChange={(event) => handleFieldChange('principais_riscos', event.target.value)}
                rows="4"
                required
              />
            </label>

            <label className="field">
              <span>Principais evidencias</span>
              <textarea
                value={form.principais_evidencias}
                onChange={(event) => handleFieldChange('principais_evidencias', event.target.value)}
                rows="4"
                required
              />
            </label>

            <label className="field">
              <span>Principais causas</span>
              <textarea
                value={form.principais_causas}
                onChange={(event) => handleFieldChange('principais_causas', event.target.value)}
                rows="4"
                required
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Procedimentos</h2>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Procedimento do agente</span>
              <textarea
                value={form.procedimento_agente}
                onChange={(event) => handleFieldChange('procedimento_agente', event.target.value)}
                rows="6"
                required
              />
            </label>

            <label className="field">
              <span>Observacoes</span>
              <textarea value={form.observacoes} onChange={(event) => handleFieldChange('observacoes', event.target.value)} rows="4" />
            </label>
          </div>
        </section>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

        <div className="sticky-actions sticky-actions-mobile">
          <button className="button button-primary button-full button-tall" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar POP'}
          </button>
        </div>
      </form>
    </div>
  );
}
