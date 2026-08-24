-- Vídeos licenciados para reprodução dentro do aplicativo.
-- Preserva o campo video_url anterior como fallback externo.
-- Fonte: wger.de exercise API. Licenças e autores são armazenados por exercício.

grant select on public.fichas_compartilhamentos to authenticated;

with videos(nome, url, licenca, autor) as (
  values
    ('Afundo com Barra','https://wger.de/media/exercise-video/46/200d9889-322f-476a-a47b-f15a1a97934a.MOV','Creative Commons Attribution Share Alike 4','Mikko Ruohola'),
    ('Afundo Caminhando com Barra','https://wger.de/media/exercise-video/802/85d1d7f8-c3c5-47e8-9b26-56896919e6e7.MOV','Creative Commons Attribution Share Alike 4','wger community'),
    ('Afundo com halteres','https://wger.de/media/exercise-video/205/c167ac34-ddbc-4e1b-8edf-1192e9d00e22.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Supino reto com barra','https://wger.de/media/exercise-video/73/2bdb390c-312c-4497-a722-5eed2c823e5a.MOV','Creative Commons Attribution Share Alike 3','sistab2'),
    ('Supino reto com halteres','https://wger.de/media/exercise-video/75/080c799b-8afd-4130-8d72-9cef0cd79f54.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Supino Inclinado com Barra - Pegada Média','https://wger.de/media/exercise-video/538/4349a6f6-4cee-4c09-828b-c5e7fc2c1ff1.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Supino inclinado com halteres','https://wger.de/media/exercise-video/537/b9c937e9-daeb-42a9-be8e-7a77e368478c.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Rosca direta com barra','https://wger.de/media/exercise-video/91/483f4bff-e108-41f1-8e7b-0caf24952552.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Rosca alternada com halteres','https://wger.de/media/exercise-video/92/8bfb917c-3d0d-49b9-8073-5d7e01c1b894.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Rosca martelo alternada','https://wger.de/media/exercise-video/272/df069052-2173-4f24-855f-a0eebe729f24.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Rosca martelo no cabo com corda','https://wger.de/media/exercise-video/275/af1fff93-eb58-4ba7-97a4-b38ee67853b4.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Rosca Scott','https://wger.de/media/exercise-video/465/b64ca95b-c677-4f3b-bb50-f75edc81aa74.MOV','Creative Commons Attribution Share Alike 3','cgoob883'),
    ('Face pull','https://wger.de/media/exercise-video/222/245a824b-cd39-45f2-b251-2c0b7efead0d.MOV','Creative Commons Attribution Share Alike 4','abeworld'),
    ('Agachamento frontal','https://wger.de/media/exercise-video/257/ad8ac7d9-b04d-415f-ae0e-837942ce2840.MOV','Creative Commons Attribution Share Alike 3','sistab2'),
    ('Elevação lateral','https://wger.de/media/exercise-video/348/de69928a-8a35-4096-821c-1f46de5e0e03.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Desenvolvimento com halteres','https://wger.de/media/exercise-video/567/64f33c19-1d96-4b7c-af17-6c6a4941c614.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Elevação pélvica com barra','https://wger.de/media/exercise-video/294/45bacf4b-1bb6-4d47-8bd1-9f00eddd4019.MOV','Creative Commons Attribution Share Alike 4','Bret Contreras'),
    ('Leg press','https://wger.de/media/exercise-video/371/6aae16b4-01b9-4eb4-935c-3250f84d2c59.MOV','Creative Commons Public Domain 1.0','BFad07'),
    ('Mesa flexora','https://wger.de/media/exercise-video/365/becaf013-5044-40d0-bae9-7ed60c973737.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Flexora sentada','https://wger.de/media/exercise-video/366/43df4b79-d4c3-4fbf-bcb5-e0d825b84120.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Levantamento terra romeno','https://wger.de/media/exercise-video/507/307e7276-a14d-4ea0-b579-f5b0dbc6f5af.MOV','Creative Commons Attribution Share Alike 4','pjwirth'),
    ('Remada baixa no cabo','https://wger.de/media/exercise-video/512/fff4c294-93f0-4926-b3a2-bf59ad4afaa5.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Panturrilha sentada','https://wger.de/media/exercise-video/590/a325ae2e-686b-4a1f-aff2-ba37fa3fa157.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Panturrilha em pé','https://wger.de/media/exercise-video/622/35b7b625-77fd-4c09-8c57-3ad0f2f23175.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Mergulho para tríceps','https://wger.de/media/exercise-video/194/d039ec90-474d-47a9-a3ad-bf0b00828c82.MP4','Creative Commons Public Domain 1.0','BFad07'),
    ('Extensão de tríceps acima da cabeça','https://wger.de/media/exercise-video/211/85f6eb25-a76c-409e-9af9-497794ac0dfb.MOV','Creative Commons Attribution Share Alike 3','tuninx'),
    ('Tríceps na polia','https://wger.de/media/exercise-video/659/1f2eb3b6-3185-429f-8330-26dc88f39aff.MOV','Creative Commons Attribution Share Alike 3','wger.de'),
    ('Encolhimento no Smith','https://wger.de/media/exercise-video/575/a7d99f2b-86fc-433a-8ab1-83144c802296.MOV','Creative Commons Attribution Share Alike 3','wger.de')
)
update public.exercicios e
set video_embutido_url = v.url,
    video_embutido_licenca = v.licenca,
    video_embutido_autor = v.autor,
    atualizado_em = now()
from videos v
where lower(btrim(e.nome)) = lower(btrim(v.nome))
  and e.ativo = true;
