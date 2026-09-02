import { getDb } from './index';

// H50 示例数据，如实转录自 H50 文件夹内 2025FMNTN09E04H50 系列 docx
export function seedExcavation() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM excavation_features').get() as { c: number };
  if (count.c > 0) return;

  const feature = {
    feature_number: 'H50',
    feature_type: '灰坑',
    trench_number: 'TN09E04',
    position: '横穿TN09E04西、南壁',
    shape: '不规则弧形',
    opening_size: '总长630cm、最宽220cm',
    depth: '62cm',
    bottom_size: '无',
    drawing_info: 'NO-1 2025FMNTN09E04H50平面位置图\nNO-2 2025FMNTN09E04H50平面图、南北向剖面\nNO-3 2025FMNTN09E04H50平面图、东西向剖面',
    photo_info: '王智超',
    excavation_process: 'H50位于TN09E04探方中部，贯穿探方西南壁，南部延伸进入TN08E04探方约15厘米，西侧延伸进入TN09E03探方约1米，平面呈不规则长条形，为三坑组合，开口于⑦层下。\n2026年1月12日TN09E04探方清理完⑦层残余刮面时，下面露出红烧土层，最初判定红烧土为坑内堆积，编号为H50，后经清理红烧土为叠压在H50上的灶3，清理完灶3确定H50实际边界后，拍H50开口照，接着采用二分之一解剖法，解剖H50东和中最大径（方向约330度），清理北侧坑内填土，解剖的下挖过程严格按照《田野考古工作规程》的要求，自上而下，由晚及早逐层清理。坑内填土全部收集，出土物分类并做好记录，清理完后收拾四周拍摄剖面照，并画剖面图。接着清理南侧填土至底部，坑内填土全部收集，出土物分类并做好记录，至1月18日清理结束，收拾完拍完工三维照，清理结束。',
    wall_bottom_detail: 'H50平面呈不规则弧形，为三坑组合，分别被③下G3和⑥层下的H43、H46、H47、Z3叠压和打破，H50中间坑形规整，椭圆形，长230厘米，宽125厘米，深62厘米，壁面较光滑，底部呈凹镜面状，壁面和底面均未见加工痕。',
    stratigraphy: '⑦→Z3→H50→基岩',
    dating: '根据H50填土内遗物为新石器中期典型的夹砂陶，推测H50年代应为新石器中期。',
    function_nature: '蓄水坑',
    sampling: '①层土样7袋、2025FMNTN09E04H50 1-7（依次编号）\n②层土样1袋、2025FMNTN09E04H50-1\n③层土样2袋、2025FMNTN09E04H50 1-2（依次编号）',
    remarks: '土样有改动，浮选时对照入库登记表',
    recorder: '赵秀玉',
    record_date: '2026-01-30',
    site_name: '牛头山遗址',
    district: '东1区',
    year: '2025',
  };

  const now = new Date().toISOString();
  const featureId = db.prepare(
    `INSERT INTO excavation_features (
      feature_number, feature_type, trench_number, position, shape, opening_size, depth, bottom_size,
      drawing_info, photo_info, excavation_process, wall_bottom_detail, stratigraphy, dating,
      function_nature, sampling, remarks, recorder, record_date, site_name, district, year,
      created_at, updated_at
    ) VALUES (
      @feature_number, @feature_type, @trench_number, @position, @shape, @opening_size, @depth, @bottom_size,
      @drawing_info, @photo_info, @excavation_process, @wall_bottom_detail, @stratigraphy, @dating,
      @function_nature, @sampling, @remarks, @recorder, @record_date, @site_name, @district, @year,
      @created_at, @updated_at
    )`
  ).run({ ...feature, created_at: now, updated_at: now }).lastInsertRowid as number;

  const layers = [
    {
      layer_number: '①', soil_color: '棕褐色加风化土', soil_texture: '', density: '致密',
      thickness: '30厘米', deposit_shape: '', inclusions: '大量基岩碎粒、小砾石和零星的石块、碳粒、烧土粒、陶片等',
      preservation: '良好', cleaning_method: '使用小锄头和手铲清理，依《田野考古工作规程》，自上而下，由晚及早，每次4-5cm',
      deposit_nature: '自然填土', depth_text: '', remarks: '',
    },
    {
      layer_number: '②', soil_color: '灰棕色细沙土', soil_texture: '细沙土', density: '致密',
      thickness: '12厘米', deposit_shape: '', inclusions: '有零星的小砾石，底部较多不规则石块',
      preservation: '', cleaning_method: '', deposit_nature: '', depth_text: '', remarks: '',
    },
    {
      layer_number: '③', soil_color: '棕褐色土', soil_texture: '', density: '致密',
      thickness: '12厘米', deposit_shape: '', inclusions: '大量完整贝壳和零星的兽骨、夹砂陶片等',
      preservation: '', cleaning_method: '', deposit_nature: '', depth_text: '', remarks: '仅分布在中间坑',
    },
  ];

  const insertLayer = db.prepare(
    `INSERT INTO feature_layers (feature_id, layer_number, soil_color, soil_texture, density, thickness,
      deposit_shape, inclusions, preservation, cleaning_method, deposit_nature, depth_text, remarks, sort_order)
     VALUES (@feature_id, @layer_number, @soil_color, @soil_texture, @density, @thickness,
      @deposit_shape, @inclusions, @preservation, @cleaning_method, @deposit_nature, @depth_text, @remarks, @sort_order)`
  );
  layers.forEach((l, i) => insertLayer.run({ feature_id: featureId, ...l, sort_order: i }));

  const artifacts = [
    { layer_number: '①', type: '夹砂灰陶片', quantity: '1袋', number: '2025FMNTN09E04H50①-1', remarks: '' },
    { layer_number: '①', type: '石块', quantity: '1袋', number: '2025FMNTN09E04H50①-1', remarks: '' },
    { layer_number: '③', type: '陶片', quantity: '1袋', number: '2025FMNTN09E04H50③ 1-3 依次编号', remarks: '' },
    { layer_number: '③', type: '兽骨', quantity: '1袋', number: '2025FMNTN09E04H50③-1', remarks: '' },
    { layer_number: '③', type: '石块', quantity: '1袋', number: '2025FMNTN09E04H50③-1', remarks: '' },
    { layer_number: '③', type: '贝壳', quantity: '1袋', number: '2025FMNTN09E04H50③-1', remarks: '' },
  ];

  const insertArtifact = db.prepare(
    `INSERT INTO feature_artifacts (feature_id, layer_number, type, quantity, number, remarks, sort_order)
     VALUES (@feature_id, @layer_number, @type, @quantity, @number, @remarks, @sort_order)`
  );
  artifacts.forEach((a, i) => insertArtifact.run({ feature_id: featureId, ...a, sort_order: i }));
}
