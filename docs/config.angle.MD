
Thiết kế Chi tiết Hệ thống Multi-Agent AI Tùy chỉnh với Gemini: Kiến trúc Phân tích Thực đơn Thông minh và An toàn Thực phẩm


1. Tóm tắt Điều hành (Executive Summary)

Sự phát triển của các Mô hình Ngôn ngữ Lớn (Large Language Models - LLMs) đã đánh dấu một bước chuyển mình quan trọng từ các hệ thống tạo văn bản đơn thuần sang các tác nhân (agents) tự chủ, có khả năng nhận thức đa phương thức và suy luận phức tạp. Báo cáo này trình bày chi tiết thiết kế kiến trúc và quy trình triển khai thực tế của một Hệ thống Đa Tác nhân (Multi-Agent System - MAS) sử dụng các mô hình Gemini 1.5 Pro và Gemini 1.5 Flash của Google. Miền ứng dụng cụ thể được chọn làm bản thiết kế chi tiết (blueprint) cho kiến trúc này là một môi trường phức tạp và đòi hỏi độ chính xác cao: Số hóa Thực đơn Thông minh và Phân tích An toàn Thực phẩm cho Ẩm thực Việt Nam.
Lựa chọn miền ứng dụng này mang tính chiến lược cao. Ẩm thực Việt Nam, với việc sử dụng tinh tế các thành phần gây dị ứng "ẩn" (như mắm tôm, đậu phộng, sa tế chứa tôm khô) và cấu trúc thực đơn phi tuyến tính, đặt ra một bài toán kiểm thử nghiêm ngặt cho AI đa phương thức. Một mô hình đơn lẻ khi cố gắng phân tích bố cục hình ảnh, xác định các chất gây dị ứng tiềm ẩn và tối ưu hóa giá cả cùng một lúc thường gặp phải hiện tượng "phân tán sự chú ý" (attention dilution), dẫn đến sai sót. Do đó, chúng tôi đề xuất Kiến trúc Ba Tác nhân (Three-Agent Architecture) hoạt động phối hợp:
Tác nhân Trích xuất Thị giác (Visual Extraction Agent - VEA): Chịu trách nhiệm Nhận dạng Ký tự Quang học (OCR), phân tích bố cục không gian và trích xuất dữ liệu có cấu trúc (JSON) từ hình ảnh thực đơn thô.
Tác nhân An toàn & Dị ứng Ẩm thực (Culinary Safety & Allergen Agent - CSAA): Một động cơ suy luận chuyên biệt được trang bị kiến thức sâu rộng về nguyên liệu Việt Nam, nguy cơ lây nhiễm chéo và các dấu hiệu dị ứng ẩn.
Tác nhân Tối ưu hóa Thương mại (Commercial Optimization Agent - COA): Một tác nhân phân tích tập trung vào kỹ thuật thực đơn (menu engineering), tâm lý học giá cả và tối ưu hóa thuật toán giao hàng.
Báo cáo này cung cấp một hướng dẫn kỹ thuật toàn diện, bao gồm các mẫu tích hợp dựa trên NestJS, chiến lược kỹ thuật gợi ý (prompt engineering) chi tiết, và cơ sở lý thuyết về việc điều phối các tác nhân này để hoạt động như một hệ thống gắn kết. Chúng tôi sẽ đi sâu vào từng lớp của kiến trúc, từ việc xử lý dữ liệu nhị phân của hình ảnh đến việc xây dựng các đồ thị tri thức (knowledge graphs) cho từng tác nhân, đảm bảo hệ thống không chỉ hoạt động về mặt kỹ thuật mà còn mang lại giá trị thực tiễn và an toàn cho người dùng cuối.

2. Cơ sở Kiến trúc: Hệ sinh thái Gemini và Chiến lược Đa Mô hình

Sự thành công của bất kỳ hệ thống AI tùy chỉnh nào cũng bắt đầu từ việc lựa chọn mô hình nền tảng phù hợp. Hệ sinh thái Gemini của Google cung cấp các cấp độ mô hình riêng biệt, chủ yếu là Gemini 1.5 Pro và Gemini 1.5 Flash, mỗi mô hình đóng một vai trò chiến lược khác nhau trong kiến trúc đa tác nhân của chúng tôi. Việc hiểu rõ điểm mạnh và điểm yếu của từng biến thể là chìa khóa để tối ưu hóa hiệu suất, chi phí và độ trễ của toàn bộ hệ thống.

2.1. Bản đồ Năng lực và Lựa chọn Mô hình


2.1.1. Gemini 1.5 Pro: Động cơ Suy luận Phức tạp (Reasoning Engine)

Gemini 1.5 Pro được đặc trưng bởi cửa sổ ngữ cảnh khổng lồ (lên đến 2 triệu token) và khả năng suy luận vượt trội.1 Trong kiến trúc của chúng tôi, mô hình này đóng vai trò là bộ não trung tâm cho Tác nhân An toàn & Dị ứng Ẩm thực (CSAA). Việc xác định xem một món ăn cụ thể của Việt Nam như Bún Riêu có chứa động vật có vỏ (shellfish) hay không đòi hỏi nhiều hơn là việc so khớp từ khóa đơn giản. Nó đòi hỏi khả năng suy luận suy diễn để hiểu rằng riêu ám chỉ gạch cua đồng và mắm tôm là mắm tôm lên men, cả hai đều là những rủi ro tử thần đối với người dị ứng hải sản.2 Khả năng của Pro trong việc xử lý các hướng dẫn dày đặc và ngữ cảnh dài làm cho nó trở thành lựa chọn lý tưởng cho phân tích rủi ro cao này, nơi sai sót có thể dẫn đến hậu quả nghiêm trọng về sức khỏe. Hơn nữa, khả năng xử lý văn bản dài cho phép chúng ta nạp vào mô hình các tài liệu y khoa và hướng dẫn an toàn thực phẩm chi tiết ngay trong thời gian thực (runtime context) mà không sợ bị tràn bộ nhớ.

2.1.2. Gemini 1.5 Flash: Trích xuất Tốc độ Cao (High-Throughput Extraction)

Ngược lại, Gemini 1.5 Flash được tối ưu hóa cho tốc độ phản hồi và hiệu quả chi phí.4 Đây là mô hình được chỉ định cho Tác nhân Trích xuất Thị giác (VEA). Quá trình số hóa thực đơn thường liên quan đến việc xử lý khối lượng lớn hình ảnh trong thời gian ngắn, nơi độ trễ thấp là yếu tố quan trọng để đảm bảo trải nghiệm người dùng mượt mà. Khả năng đa phương thức (multimodal) của Flash cho phép nó xử lý hình ảnh và trích xuất văn bản cực kỳ nhanh chóng. Mặc dù có thể kém tinh tế hơn Pro trong các tác vụ suy luận trừu tượng, nhưng hiệu suất của Flash đối với việc trích xuất dữ liệu có cấu trúc (từ OCR sang JSON) là hoàn toàn đủ và chính xác khi được hướng dẫn bởi các lược đồ (schemas) nghiêm ngặt.4 Sự phân chia lao động này—sử dụng Flash cho nhận thức thị giác nhanh và Pro cho suy luận sâu—tạo ra một sự cân bằng tối ưu giữa chi phí vận hành và chất lượng đầu ra.

2.2. Đầu ra Có cấu trúc và Tính Thực thi JSON (Structured Output)

Một trong những thách thức lớn nhất trong các hệ thống đa tác nhân là giao tiếp giữa các tác nhân (inter-agent communication). Nếu Tác nhân A xuất ra ngôn ngữ tự nhiên (ví dụ: "Tôi thấy món Phở giá 50 ngàn"), Tác nhân B phải phân tích cú pháp văn bản đó, điều này rất dễ gây ra lỗi và sự mơ hồ. Để giảm thiểu rủi ro này, chúng tôi tận dụng triệt để các khả năng Tạo sinh Có kiểm soát (Controlled Generation) của Gemini.
Gemini hỗ trợ việc thực thi đầu ra JSON hợp lệ thông qua định nghĩa lược đồ (schema definition).6 Bằng cách cung cấp một lược đồ JSON cứng (rigid JSON schema) trong cấu hình prompt, chúng tôi đảm bảo rằng Tác nhân Trích xuất Thị giác sẽ xuất ra một đối tượng máy có thể đọc được (ví dụ: {"dishName": "Pho Bo", "price": 50000}) thay vì một câu văn hội thoại. Điều này đạt được bằng cách xác định responseMimeType là application/json và cung cấp một đối tượng schema trong generationConfig.8
Phân tích Chuyên sâu: Việc sử dụng các ràng buộc enum trong schema là đặc biệt mạnh mẽ đối với Tác nhân Dị ứng. Thay vì cho phép mô hình tạo ra các mức độ rủi ro mơ hồ (như "khá nguy hiểm" hay "có thể có chút ít"), chúng tôi thực thi các phân loại nghiêm ngặt mà mã nguồn có thể xử lý ngay lập tức: ``.6 Điều này biến đầu ra của AI từ một văn bản tham khảo thành một biến số lập trình có thể kích hoạt các luồng logic nghiệp vụ cụ thể (như hiển thị cảnh báo đỏ trên giao diện người dùng).

2.3. Hướng dẫn Hệ thống và Tiêm Persona (System Instructions)

Hướng dẫn hệ thống (System Instructions) hoạt động như "hệ điều hành" cho tác nhân, định nghĩa hành vi, giọng điệu và giới hạn của nó trước khi nó xử lý bất kỳ đầu vào nào từ người dùng.10 Đối với các tác nhân trong hệ thống này, hướng dẫn hệ thống không chỉ đơn thuần là các câu lệnh chung chung như "bạn là một trợ lý hữu ích". Chúng là các tệp định nghĩa phức tạp chứa kiến thức miền (domain knowledge) sâu sắc.
Ví dụ, hướng dẫn hệ thống của CSAA bao gồm một "Đồ thị Tri thức" (Knowledge Graph) về các nguyên liệu Việt Nam được tổng hợp từ nghiên cứu sâu rộng.2 Nó được hướng dẫn rõ ràng rằng Sa Tế (sốt ớt) thường chứa chiết xuất giáp xác 12, và rằng Chả (giò lụa, chả quế) có thể chứa bột mì như một chất kết dính.2 Việc tiêm kiến thức này vào cấp độ hệ thống (system level) thay vì cấp độ người dùng (user prompt level) đảm bảo rằng kiến thức này luôn tồn tại và không bị "trôi" (drift) trong quá trình hội thoại dài, đồng thời giúp mô hình tập trung tài nguyên vào việc áp dụng kiến thức thay vì phải "học" lại kiến thức đó mỗi lần được gọi.

3. Tác nhân 1: Tác nhân Trích xuất Thị giác (Visual Extraction Agent - VEA)

Tác nhân đầu tiên trong đường ống xử lý là cầu nối quan trọng giữa thế giới vật lý (hình ảnh thực đơn trên giấy, bảng hiệu) và hệ thống kỹ thuật số. Chỉ thị chính của nó là Nhận dạng Ký tự Quang học (OCR) Độ trung thực Cao và Bảo tồn Bố cục.

3.1. Thách thức Đầu vào Đa phương thức và Xử lý Hình ảnh

Xử lý hình ảnh thực đơn đòi hỏi khả năng xử lý các đầu vào đa dạng về chất lượng, ánh sáng và định dạng. Tác nhân phải chấp nhận dữ liệu hình ảnh dưới dạng chuỗi mã hóa Base64 (đối với tải trọng nhỏ hơn 20MB) hoặc thông qua API Tệp (đối với các lô lớn hoặc tệp video).14

3.1.1. Mã hóa Base64 và Các bẫy Thường gặp

Khi tích hợp Gemini trong môi trường Node.js, một chế độ lỗi phổ biến mà các nhà phát triển thường gặp phải là lỗi "Base64 decoding failed".16 Lỗi này thường xảy ra khi tiêu đề (header) data:image/jpeg;base64, (thường được các trình duyệt thêm vào khi đọc file) được bao gồm trong tải trọng gửi đến API của Google. Mã wrapper của VEA phải có logic để loại bỏ (strip) tiêu đề này và đảm bảo chuỗi là một tuần tự hóa thuần túy của dữ liệu nhị phân. Hơn nữa, việc xử lý inline_data một cách chính xác là điều cần thiết để duy trì tốc độ phiên làm việc.14 Một vấn đề khác cần lưu ý là định dạng hình ảnh; trong khi JPEG và PNG là tiêu chuẩn, các định dạng mới như WebP hoặc HEIC có thể yêu cầu chuyển đổi trước khi gửi, mặc dù Gemini ngày càng hỗ trợ nhiều định dạng hơn.

3.2. Kỹ thuật Gợi ý (Prompt Engineering) cho Phân tích Bố cục

Thực đơn nhà hàng là những tài liệu phi tuyến tính. Chúng chứa các cột, tiêu đề lồng nhau, và các phần riêng biệt (ví dụ: "Khai vị", "Món chính", "Tráng miệng"). Các công cụ OCR tiêu chuẩn thường làm phẳng cấu trúc này thành một dòng văn bản duy nhất từ trái sang phải, từ trên xuống dưới, làm mất đi mối liên kết không gian quan trọng giữa tên món ăn và giá tiền của nó (ví dụ: món ăn ở cột trái, giá ở cột phải).
VEA sử dụng Chiến lược Gợi ý Nhận thức Không gian (Spatial-Aware Prompt Strategy). Lời nhắc (prompt) không đơn giản hỏi "Văn bản trong hình ảnh này là gì?"; nó hướng dẫn mô hình "Trích xuất các mục thực đơn dưới dạng một đối tượng JSON phân cấp, nhóm các mục dưới các tiêu đề phần tương ứng được phát hiện bằng thị giác".17
Kỹ thuật Gợi ý Quan trọng: Few-Shot Layout Examples (Ví dụ Bố cục Ít lần)
Để cải thiện độ chính xác, chúng tôi cung cấp cho tác nhân các ví dụ "few-shot"—các cặp hình ảnh thực đơn và đầu ra JSON lý tưởng tương ứng của chúng. Bản đồ hình ảnh-sang-văn bản này giúp mô hình "hiểu" về mặt thị giác rằng một mức giá được liệt kê ở phía xa bên phải tương ứng với mục ở phía xa bên trái của cùng một dòng, ngay cả khi có một khoảng trắng lớn ở giữa.19 Kỹ thuật này đặc biệt hiệu quả với các thực đơn tiếng Việt, nơi tên món ăn có thể rất dài và giá tiền thường được viết tắt (ví dụ: "50k" thay vì "50.000").

3.3. Lược đồ Đầu ra cho VEA

VEA bị ràng buộc nghiêm ngặt với cấu trúc lược đồ sau đây để đảm bảo các tác nhân hạ nguồn có thể xử lý dữ liệu một cách lập trình:
Gốc (Root): MenuObject
Thuộc tính: sections (Mảng)
Mục: SectionObject
sectionName (Chuỗi - ví dụ: "Món Nước", "Cơm Đĩa")
items (Mảng)
dishName (Chuỗi - Nguyên văn tiếng Việt)
description (Chuỗi - Rất quan trọng cho phân tích dị ứng, ví dụ: "kèm nước mắm chua ngọt")
price (Số - Đã chuẩn hóa về đơn vị VNĐ)
visualTags (Mảng chuỗi - ví dụ: "Biểu tượng Ớt cay", "Lá Chay")
Cấu trúc đầu ra này cho phép các tác nhân tiếp theo lặp qua danh sách items một cách lập trình mà không cần phải đoán định cấu trúc dữ liệu.

4. Tác nhân 2: Tác nhân An toàn & Dị ứng Ẩm thực (Culinary Safety & Allergen Agent - CSAA)

Sau khi thực đơn được số hóa thành công, dữ liệu được chuyển đến CSAA. Đây là tác nhân phức tạp nhất về mặt kiến thức miền. Nó hoạt động như một bức tường lửa an toàn, phân tích các trường dishName và description từ VEA để xác định các rủi ro sức khỏe tiềm ẩn, đặc biệt là trong bối cảnh ẩm thực Việt Nam nơi các thành phần thường không được liệt kê đầy đủ.

4.1. Cơ sở Tri thức: Các Chất gây Dị ứng Ẩn trong Ẩm thực Việt

Để hoạt động hiệu quả, CSAA được nạp sẵn một tập hợp các quy tắc heuristic (dựa trên kinh nghiệm) bắt nguồn từ dữ liệu nghiên cứu. Tác nhân không chỉ tìm kiếm từ "đậu phộng"; nó tìm kiếm các ngữ cảnh mà đậu phộng là ngầm định.

4.1.1. Heuristic về Đậu phộng và Các loại Hạt

Tác nhân được huấn luyện để nhận ra rằng các món Gỏi (nộm/salad) và Bún Thịt Nướng (bún thịt nướng, bún chả giò) hầu như luôn luôn chứa đậu phộng rang giã nhỏ như một lớp phủ (garnish), ngay cả khi thực đơn không ghi rõ.21 Nó cũng gắn cờ cảnh báo cho các loại nước chấm cụ thể. Trong khi nước mắm pha (Nước Chấm) thường không chứa hạt, thì loại "sốt nâu" hoặc Nước Lèo (thường là sốt tương đen hoặc sốt bơ đậu phộng) phục vụ kèm với Gỏi Cuốn thường xuyên có nền tảng là bơ đậu phộng hoặc được làm đặc bằng các loại hạt.23 Đây là một điểm mù chết người đối với khách du lịch không quen thuộc với văn hóa ẩm thực địa phương.

4.1.2. Động vật có vỏ (Shellfish) và Các loại Mắm "Bí mật"

Đây là loại rủi ro cao nhất và khó phát hiện nhất. CSAA giám sát chặt chẽ các thuật ngữ:
Mắm Tôm: Mắm tôm lên men, thường xuất hiện dưới dạng nước chấm màu tím hoặc là thành phần nền trong nước dùng của Bún Riêu và Bún Đậu Mắm Tôm.2
Sa Tế: Một loại dầu ớt gia vị. Tác nhân biết rằng không giống như dầu ớt phương Tây hay Trung Quốc chỉ gồm ớt và dầu, Sa Tế Việt Nam thường xuyên chứa chiết xuất tôm khô (tôm nõn) để tạo vị umami.12 Một người dị ứng tôm ăn một món "chay" có sa tế vẫn có thể bị sốc phản vệ.
Riêu: Một thuật ngữ chỉ phần thịt và gạch cua đồng được giã nhỏ nấu thành súp.2 Tác nhân sẽ suy luận ngay lập tức: Có "Riêu" = Có Cua/Tôm.

4.1.3. Phân tích Gluten và Chất kết dính

Mặc dù bún và phở làm từ gạo là tự nhiên không chứa gluten, CSAA kiểm tra các véc-tơ lây nhiễm chéo:
Nước Tương (Soy Sauce): Thường được sử dụng để ướp thịt nướng (Thịt Nướng), đưa gluten vào các món cơm/bún vốn an toàn.26
Chả (Giò/Chả): Các loại thịt chế biến thường sử dụng bột mì hoặc vụn bánh mì làm chất kết dính hoặc chất độn.2
Chất làm đặc (Thickeners): Tác nhân phân biệt giữa bột bắp/bột năng (an toàn) và bột mì (không an toàn) thường được dùng trong các món súp đặc như Súp Cua hay nước sốt bánh mì chảo.28

4.2. Chuỗi Suy luận (Reasoning Chain) và Chấm điểm Rủi ro

CSAA sử dụng chiến lược gợi ý Chain-of-Thought (CoT). Nó không đơn giản chỉ xuất ra "Không an toàn". Nó phải tạo ra một dấu vết suy luận rõ ràng để người dùng có thể hiểu tại sao:
Ví dụ Luồng Suy luận của CSAA:
Nhận diện Thành phần: "Món ăn là Bún Bò Huế."
Truy hồi Hồ sơ Nguyên liệu: "Công thức tiêu chuẩn bao gồm bắp bò, giò heo, và huyết."
Phân tích Gia vị: "Nước dùng đặc trưng được nêm nếm bằng Mắm Ruốc (mắm tôm Huế) và Sa Tế để tạo màu và vị cay."
Đánh giá Rủi ro: "Rủi ro CAO đối với Dị ứng Động vật có vỏ do sự hiện diện bắt buộc của Ruốc và thường xuyên của Sa Tế. Rủi ro THẤP đối với Gluten trừ khi thịt bò được ướp với nước tương (ít phổ biến trong món này)."
Phân loại Đầu ra: HIGH_RISK_SHELLFISH.

4.3. Hướng dẫn Hệ thống cho CSAA

Prompt cho tác nhân này cấm tuyệt đối việc giả định an toàn. "Nếu một món ăn là dạng súp hoặc món kho (Kho), hãy giả định sự hiện diện của nước mắm (cá) và khả năng ướp nước tương (gluten) trừ khi được tuyên bố rõ ràng ngược lại".30 Sự thận trọng này được mã hóa cứng vào logic của AI.

5. Tác nhân 3: Tác nhân Tối ưu hóa Thương mại (Commercial Optimization Agent - COA)

Tác nhân cuối cùng trong bộ ba tập trung vào logic kinh doanh. Nhiệm vụ của nó là phân tích dữ liệu thực đơn không phải vì mục đích an toàn, mà vì khả năng sinh lời (profitability) và định vị thị trường.

5.1. Logic Kỹ thuật Thực đơn (Menu Engineering)

COA áp dụng Ma trận Kỹ thuật Thực đơn (Menu Engineering Matrix) 31 để phân loại các món ăn. Nó yêu cầu dữ liệu đầu vào về giá vốn hàng bán (COGS) và khối lượng bán hàng (có thể được mô phỏng hoặc lấy từ dữ liệu lịch sử).
Ngôi sao (Stars): Lợi nhuận cao, Phổ biến cao. Tác nhân khuyến nghị làm nổi bật các món này về mặt hình ảnh (ví dụ: thêm khung viền, biểu tượng "Must Try").
Ngựa thồ (Plow Horses): Lợi nhuận thấp, Phổ biến cao. Tác nhân gợi ý tăng giá nhẹ hoặc giảm khẩu phần để cải thiện biên lợi nhuận mà không làm giảm nhu cầu.
Câu đố (Puzzles): Lợi nhuận cao, Phổ biến thấp. Tác nhân gợi ý đổi tên món ăn cho hấp dẫn hơn hoặc viết lại mô tả kích thích vị giác.
Chó (Dogs): Lợi nhuận thấp, Phổ biến thấp. Tác nhân khuyến nghị loại bỏ khỏi thực đơn để giảm chi phí tồn kho.

5.2. Tâm lý học Giá cả và Bố cục

COA phân tích các chuỗi chữ số được trích xuất bởi VEA. Nó kiểm tra các chiến thuật Định giá Tâm lý, chẳng hạn như kết thúc giá bằng.95 hoặc.99. Mặc dù ở Việt Nam giá thường kết thúc bằng.000, nhưng đối với các thực đơn hướng đến khách du lịch quốc tế, việc sử dụng số lẻ có thể tạo cảm giác "giá hời".34 Quan trọng hơn, nó kiểm tra "Tam giác Vàng" (Golden Triangle)—xu hướng mắt người quét thực đơn từ giữa, sang góc trên bên phải, rồi sang góc trên bên trái. Nó tham chiếu chéo dữ liệu bố cục từ VEA để đảm bảo các mục "Ngôi sao" được đặt trong các vùng hiển thị cao này.33

5.3. Tối ưu hóa Thuật toán Giao hàng

COA cũng xem xét các heuristic của nền tảng giao hàng. Các nền tảng như GrabFood, ShopeeFood hoặc Uber Eats thường trừng phạt các nhà hàng có tỷ lệ "Món bị thiếu" cao hoặc thời gian chuẩn bị chậm.35 COA phân tích độ phức tạp của thực đơn. Nếu một món ăn yêu cầu quá nhiều tùy chỉnh (ví dụ: "Tự chọn nguyên liệu Bánh Mì" với 20 checkbox), Tác nhân sẽ gắn cờ đây là một nút thắt cổ chai tiềm năng cho hiệu quả giao hàng, gợi ý tạo một "Combo Đặc biệt" (Signature Combo) được cấu hình sẵn cho thực đơn giao hàng để giảm thời gian thao tác và cải thiện xếp hạng thuật toán.35

6. Tích hợp: Kiến trúc Mã nguồn "3-Agent" với NestJS

Phần này giải quyết yêu cầu cụ thể của người dùng về việc tích hợp mã nguồn. Chúng tôi sử dụng NestJS, một framework Node.js tiến bộ, nhờ vào kiến trúc mô-đun của nó, ánh xạ hoàn hảo với ranh giới của các tác nhân AI.37 Kiến trúc này tuân thủ các nguyên tắc SOLID và Injection Dependency, cho phép dễ dàng mở rộng hoặc thay thế mô hình AI trong tương lai.

6.1. Sơ đồ Kiến trúc Hệ thống (Khái niệm)

Kiến trúc luồng dữ liệu được thiết kế theo mô hình pipeline bất đồng bộ:

Đoạn mã


graph TD
    Client[Client App / Mobile] -->|Upload Image| Gateway[API Gateway / Controller]
    Gateway -->|Process Request| Orchestrator
    
    subgraph "Hệ sinh thái Gemini Agent (NestJS Modules)"
        Orchestrator -->|Bước 1: Gửi ảnh| VEA[Visual Extraction Agent]
        VEA -->|Trả về JSON thô| Orchestrator
        
        Orchestrator -->|Bước 2: Dữ liệu món ăn| CSAA
        CSAA -->|Cờ cảnh báo an toàn| Orchestrator
        
        Orchestrator -->|Bước 3: Dữ liệu món ăn| COA[Commercial Optimization Agent]
        COA -->|Chiến lược giá| Orchestrator
    end
    
    Orchestrator -->|Báo cáo Tổng hợp| Client



6.2. Thiết kế Mô-đun NestJS

Chúng tôi tuân thủ mẫu Shared Module.38 Chúng tôi tạo ra một GeminiCoreModule xử lý các khóa API và khởi tạo máy khách cơ bản, sau đó được tiêm (inject) vào các dịch vụ tác nhân cụ thể. Điều này giúp quản lý kết nối tập trung và tái sử dụng mã hiệu quả.

6.2.1. Dịch vụ Gemini Cốt lõi (gemini.service.ts)

Dịch vụ này đóng gói việc khởi tạo ứng dụng khách Google Generative AI, xử lý việc nạp biến môi trường và cấu hình an toàn.

TypeScript


import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiCoreService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiCoreService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      this.logger.error('GOOGLE_API_KEY is not defined');
      throw new Error('API Key missing');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Hàm helper để lấy model với cấu hình mặc định hoặc tùy chỉnh
  getModel(modelName: string = 'gemini-1.5-pro'): GenerativeModel {
    return this.genAI.getGenerativeModel({ model: modelName });
  }
}



6.3. Triển khai Tác nhân Trích xuất Thị giác (extraction.agent.ts)

Tác nhân này sử dụng gemini-1.5-flash vì tốc độ. Điểm quan trọng ở đây là định nghĩa Schema để ép buộc đầu ra JSON. Nếu không có schema, mô hình có thể trả về văn bản lộn xộn.

TypeScript


import { Injectable } from '@nestjs/common';
import { GeminiCoreService } from './gemini-core.service';
import { SchemaType } from '@google/generative-ai';

@Injectable()
export class VisualExtractionAgent {
  constructor(private gemini: GeminiCoreService) {}

  async extractMenuFromImage(base64Image: string, mimeType: string) {
    // Sử dụng Flash cho tốc độ OCR nhanh
    const model = this.gemini.getModel('gemini-1.5-flash');

    // Định nghĩa Schema cho đầu ra JSON nghiêm ngặt
    const menuSchema = {
      description: "Cấu trúc trích xuất thực đơn",
      type: SchemaType.OBJECT,
      properties: {
        restaurantName: { type: SchemaType.STRING },
        items: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Tên món ăn nguyên bản" },
              description: { type: SchemaType.STRING, description: "Mô tả thành phần nếu có" },
              price: { type: SchemaType.NUMBER, description: "Giá tiền dạng số" },
              category: { type: SchemaType.STRING, description: "Phân loại món (Khai vị, Món chính...)" },
            },
            required: ["name", "price"]
          }
        }
      },
      required: ["items"]
    };

    const prompt = `
      Bạn là một Tác nhân Trích xuất Thị giác chuyên nghiệp (OCR Agent). 
      Nhiệm vụ: Trích xuất các món ăn từ hình ảnh thực đơn này.
      Yêu cầu:
      1. Giữ nguyên tên tiếng Việt, kể cả dấu câu.
      2. Bảo tồn các tiêu đề phần (section headers) vào trường 'category'. 
      3. Nếu có mô tả món ăn, hãy trích xuất chính xác để phục vụ phân tích dị ứng sau này.
      4. Chuyển đổi giá tiền (ví dụ '50k') thành số nguyên (50000).
    `;

    const result = await model.generateContent({
      contents:
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: menuSchema
      }
    });

    return JSON.parse(result.response.text());
  }
}



6.4. Triển khai Tác nhân An toàn Ẩm thực (allergen.agent.ts)

Tác nhân này sử dụng gemini-1.5-pro cho khả năng suy luận. Lưu ý phần "System Instruction" nơi chúng ta tiêm Cơ sở Tri thức Ẩm thực Việt Nam. Đây là "bí mật công nghệ" giúp AI thông minh hơn các công cụ dịch thuật thông thường.

TypeScript


import { Injectable } from '@nestjs/common';
import { GeminiCoreService } from './gemini-core.service';
import { SchemaType } from '@google/generative-ai';

@Injectable()
export class AllergenSafetyAgent {
  constructor(private gemini: GeminiCoreService) {}

  async analyzeRisks(menuItems: any) {
    // System Instruction: Cơ sở Tri thức (Knowledge Base)
    const systemInstruction = `
      Bạn là một chuyên gia về An toàn Thực phẩm và Độc học Ẩm thực Việt Nam.
      Nhiệm vụ của bạn là phân tích các món ăn để tìm các chất gây dị ứng tiềm ẩn (hidden allergens).
      
      CƠ SỞ TRI THỨC QUAN TRỌNG:
      1. ĐẬU PHỘNG (PEANUTS): Rất phổ biến trong các món 'Gỏi', 'Bún Thịt Nướng', và nước chấm 'Tương'. Luôn cảnh báo rủi ro nếu món ăn thuộc nhóm này.
      2. ĐỘNG VẬT CÓ VỎ (SHELLFISH): 
         - 'Mắm Tôm' là mắm tôm lên men. 
         - 'Riêu' là gạch cua/tôm. 
         - 'Sa Tế' (dầu ớt) thường chứa tôm khô xay nhuyễn.
         - 'Nước dùng' (broth) bún bò/hủ tiếu thường hầm từ mực/tôm khô.
      3. GLUTEN: Nước tương (xì dầu) được dùng rộng rãi để ướp thịt nướng ('Nướng'). 'Chả' thường dùng bột mì làm chất kết dính.
      4. LÂY NHIỄM CHÉO (CROSS-CONTAMINATION): Các món chiên ('Chả Giò') có khả năng cao dùng chung dầu với các món tẩm bột.
    `;

    const model = this.gemini.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: systemInstruction
    });

    const analysisSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dishName: { type: SchemaType.STRING },
          riskLevel: { 
            type: SchemaType.STRING, 
            enum: 
          },
          identifiedAllergens: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING } 
          },
          reasoning: { type: SchemaType.STRING, description: "Giải thích ngắn gọn tại sao lại đánh giá rủi ro như vậy" }
        }
      }
    };

    const prompt = `
      Phân tích danh sách món ăn sau đây để tìm các chất gây dị ứng tiềm năng (Đậu phộng, Hải sản, Gluten).
      Dữ liệu Thực đơn: ${JSON.stringify(menuItems)}
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    return JSON.parse(result.response.text());
  }
}



6.5. Dịch vụ Điều phối (orchestrator.service.ts)

Dịch vụ này (Orchestrator) kết nối các tác nhân lại với nhau. Nó nhận đầu vào từ VEA và chuyển tiếp kết quả đó song song cho CSAA và COA (mặc dù trong mã ví dụ dưới đây chúng tôi chỉ hiển thị kết nối với CSAA và COA để minh họa). Việc xử lý song song giúp giảm tổng thời gian phản hồi.

TypeScript


import { Injectable } from '@nestjs/common';
import { VisualExtractionAgent } from './extraction.agent';
import { AllergenSafetyAgent } from './allergen.agent';
import { CommercialOptimizationAgent } from './commercial.agent'; // Giả định đã implement

@Injectable()
export class AgentOrchestratorService {
  constructor(
    private extractionAgent: VisualExtractionAgent,
    private allergenAgent: AllergenSafetyAgent,
    private commercialAgent: CommercialOptimizationAgent
  ) {}

  async processMenuImage(fileBuffer: Buffer, mimeType: string) {
    // Bước 1: Trích xuất Dữ liệu (Vision) - Tuần tự
    const base64 = fileBuffer.toString('base64');
    const rawMenuData = await this.extractionAgent.extractMenuFromImage(base64, mimeType);

    // Bước 2 & 3: Phân tích Song song (Parallel Execution) để tối ưu tốc độ
    const = await Promise.all();

    // Tổng hợp Kết quả
    return {
      menuStructure: rawMenuData,
      safetyAnalysis: safetyReport,
      businessInsights: businessReport,
      timestamp: new Date().toISOString()
    };
  }
}



7. Các Cân nhắc Vận hành và Thực tiễn Tốt nhất (Best Practices)


7.1. Xử lý Base64 và Vận chuyển Hình ảnh

Như đã được nhấn mạnh trong đoạn trích 16, việc xử lý dữ liệu hình ảnh trong Node.js đòi hỏi sự chính xác tuyệt đối. SDK google-generative-ai mong đợi dữ liệu Base64 thô, không phải sơ đồ Data URI (ví dụ: data:image/png;base64,...). Lớp điều phối (Orchestrator) hoặc Controller phải bao gồm một tiện ích làm sạch (sanitizer utility) để loại bỏ các tiêu đề này trước khi chuyển chuỗi cho VisualExtractionAgent. Việc không làm như vậy sẽ dẫn đến lỗi "Invalid value" hoặc "Base64 decoding failed", làm gián đoạn toàn bộ quy trình.

7.2. Quản lý Giới hạn Tốc độ và Token (Rate Limiting)

Gemini 1.5 Pro cho phép ngữ cảnh lớn (2M token), nhưng nó đắt hơn về mặt tính toán.
Flash cho Vision: Luôn sử dụng gemini-1.5-flash cho lượt OCR ban đầu. Nó nhanh hơn và rẻ hơn đáng kể, và khả năng OCR của nó là quá đủ cho văn bản in ấn rõ ràng.4
Pro cho Suy luận: Hãy dành gemini-1.5-pro cho Tác nhân Dị ứng. Sự tinh tế cần thiết để hiểu rằng "Sa Tế" ngụ ý "Tôm" là một nhiệm vụ suy luận bậc cao mà các mô hình nhỏ hơn có thể bỏ sót.13
Bộ nhớ đệm (Caching): Triển khai bộ nhớ đệm (ví dụ: Redis) cho kết quả phân tích các món ăn phổ biến. "Phở Bò" không thay đổi thành phần của nó mỗi khi có khách hỏi, vì vậy không cần phải gọi AI để phân tích lại món Phở Bò hàng nghìn lần.

7.3. Xác thực "Con người trong Vòng lặp" (Human-in-the-Loop)

Mặc dù các tác nhân rất mạnh mẽ, nhưng rủi ro trong phân tích dị ứng là vấn đề sống còn. Kiến trúc nên bao gồm một trường confidenceScore trong schema của CSAA. Nếu điểm tin cậy dưới một ngưỡng nhất định (ví dụ: 0.8), hệ thống nên gắn cờ mục đó để người quản lý nhà hàng xem xét thủ công trước khi xuất bản các nhãn an toàn cho khách hàng.

8. Phân tích Chuyên sâu: Giao thoa giữa Văn hóa và Mã nguồn

Sức mạnh thực sự của Hệ thống Đa Tác nhân này không chỉ nằm ở các lệnh gọi API, mà còn ở Đồ thị Tri thức được nhúng trong Hướng dẫn Hệ thống.
Thực tế Dữ liệu về Dị ứng:
Nghiên cứu chỉ ra rằng ở Việt Nam, khái niệm "chay" (vegetarian) không phải lúc nào cũng đồng nghĩa với "không có sản phẩm động vật" theo nghĩa phương Tây nghiêm ngặt; nó thường có nghĩa là "không có thịt đỏ" nhưng vẫn có thể bao gồm nước mắm hoặc tôm khô trong gia vị.2 Hơn nữa, các loại nước sốt thuần thực vật đôi khi được làm đặc bằng vụn bánh mì (gluten) hoặc bột đậu phộng.23
Một mô hình AI chung chung có thể thấy "Gỏi Cuốn Chay" và gắn thẻ nó là An toàn. CSAA của chúng tôi, được nạp sẵn thông tin cụ thể rằng tương (nước chấm) thường chứa đậu phộng ẩn 3, sẽ gắn cờ nước chấm đi kèm là rủi ro ngay cả khi bản thân cuốn gỏi là an toàn. Sự phân biệt tinh tế này chính là giá trị cốt lõi của việc sử dụng AI chuyên biệt hóa (domain-specific AI).
Thực tế Thương mại:
Tương tự, COA hiểu rằng trong bối cảnh các ứng dụng giao hàng, "nhóm gộp" (bundling) là một thủ thuật thuật toán quan trọng.35 Các ứng dụng giao hàng ưu tiên kích thước giỏ hàng cao hơn. Do đó, Tác nhân không chỉ phân tích giá; nó chủ động đề xuất tạo "Combo Gia đình" từ các món "Ngôi sao" riêng lẻ để tăng Giá trị Đơn hàng Trung bình (AOV) và cải thiện thứ hạng hiển thị trên ứng dụng.

9. Kết luận và Triển vọng Tương lai

Báo cáo này đã phác thảo một kiến trúc mạnh mẽ, có thể mở rộng cho một Hệ thống Đa Tác nhân sử dụng Gemini AI. Bằng cách phân rã vấn đề thành các miền Trích xuất, An toàn, và Thương mại, chúng tôi tận dụng được những điểm mạnh cụ thể của các mô hình Gemini khác nhau (Flash cho tốc độ/thị giác, Pro cho suy luận sâu).
Cấu trúc mã NestJS được cung cấp minh họa cách đóng gói các tác nhân này thành các dịch vụ mô-đun, đảm bảo rằng ứng dụng có thể bảo trì và kiểm thử được. Việc tích hợp các lược đồ JSON nghiêm ngặt đảm bảo rằng các tác nhân này có thể giao tiếp trôi chảy, biến các điểm ảnh phi cấu trúc thành những hiểu biết có cấu trúc, có thể hành động và cứu sống mạng người.
Kiến trúc này đại diện cho sự chuyển dịch từ việc "sử dụng công cụ AI" sang "xây dựng lực lượng lao động AI", nơi các tác nhân chuyên biệt cộng tác để giải quyết các vấn đề phức tạp, thực tế như an toàn thực phẩm và tối ưu hóa kinh doanh trong các thị trường ẩm thực năng động. Tương lai của công nghệ này hứa hẹn không chỉ dừng lại ở thực đơn, mà còn mở rộng sang quản lý kho, dự báo nhu cầu và cá nhân hóa trải nghiệm khách hàng ở quy mô lớn.
Nguồn trích dẫn
Got any Gemini best practices? : r/SillyTavernAI - Reddit, truy cập vào tháng 11 19, 2025, https://www.reddit.com/r/SillyTavernAI/comments/1ark189/got_any_gemini_best_practices/
The ultimate guide to eating food allergies, dietary and religious restrictions in Vietnam, truy cập vào tháng 11 19, 2025, https://scootersaigonadventure.com/guide-to-eating-food-allergies-dietary-and-religious-restrictions-in-vietnam/
Traveling with Food Allergies in Vietnam - 10 Travel Tips, truy cập vào tháng 11 19, 2025, https://localvietnam.com/blog/traveling-with-food-allergies-in-vietnam/
Mastering Controlled Generation with Gemini 1.5: Schema Adherence for Developers, truy cập vào tháng 11 19, 2025, https://developers.googleblog.com/en/mastering-controlled-generation-with-gemini-15-schema-adherence/
Base64 encode and decode files | Generative AI on Vertex AI | Google Cloud Documentation, truy cập vào tháng 11 19, 2025, https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/base64-encode
Generate structured output (like JSON and enums) using the Gemini API | Firebase AI Logic, truy cập vào tháng 11 19, 2025, https://firebase.google.com/docs/ai-logic/generate-structured-output
Structured Outputs | Gemini API - Google AI for Developers, truy cập vào tháng 11 19, 2025, https://ai.google.dev/gemini-api/docs/structured-output
Structured output | Generative AI on Vertex AI | Google Cloud Documentation, truy cập vào tháng 11 19, 2025, https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output
Structured output support for the Prompt API | AI on Chrome, truy cập vào tháng 11 19, 2025, https://developer.chrome.com/docs/ai/structured-output-for-prompt-api
Use system instructions to steer the behavior of a model | Firebase AI Logic - Google, truy cập vào tháng 11 19, 2025, https://firebase.google.com/docs/ai-logic/system-instructions
Use system instructions | Generative AI on Vertex AI | Google Cloud Documentation, truy cập vào tháng 11 19, 2025, https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/system-instructions
Sate Tom Vietnam Chili Oil 100 g, truy cập vào tháng 11 19, 2025, https://igmvn.com/product/sate-tom-vietnam-chili-oil-100-g/
Vietnamese “Sa Tế” Chilli Oil - DELLI, truy cập vào tháng 11 19, 2025, https://delli.market/products/vietnamese-sa-te-chilli-sauce
Image understanding | Gemini API | Google AI for Developers, truy cập vào tháng 11 19, 2025, https://ai.google.dev/gemini-api/docs/image-understanding
Supported input files and requirements | Firebase AI Logic - Google, truy cập vào tháng 11 19, 2025, https://firebase.google.com/docs/ai-logic/input-file-requirements
Resolving Base64 Decoding Issues in the Node.js API for Chat App Image Processing in Gemini 1.5 Pro | by Denis Bélanger 💎⚡✨ | Medium, truy cập vào tháng 11 19, 2025, https://medium.com/@tempmailwithpassword/resolving-base64-decoding-issues-in-the-node-js-api-for-chat-app-image-processing-in-gemini-1-5-pro-3e5a43bb6dba
Using LLM to transcribe restaurant menu photos - DoorDash, truy cập vào tháng 11 19, 2025, https://careersatdoordash.com/blog/doordash-llm-transcribe-menu/
Plate Parser: A Modular LLM-Powered System for Intelligent Menu Digitization and Retrieval, truy cập vào tháng 11 19, 2025, https://medium.com/@hrishikesh19202/plate-parser-a-modular-llm-powered-system-for-intelligent-menu-digitization-and-retrieval-f30c1acade98
Prompt design strategies | Gemini API | Google AI for Developers, truy cập vào tháng 11 19, 2025, https://ai.google.dev/gemini-api/docs/prompting-strategies
Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context - arXiv, truy cập vào tháng 11 19, 2025, https://arxiv.org/html/2403.05530v2
Does Vietnamese Food Have Peanuts? A Guide for Allergy Sufferers - KissTour, truy cập vào tháng 11 19, 2025, https://kisstour.com/travel-guide/does-vietnamese-food-have-peanuts-a-guide-for-allergy-sufferers/
Allergy-Friendly Vietnamese Dining: Safe Options for Nut, Soy, and Seafood Allergies, truy cập vào tháng 11 19, 2025, https://torontopho.wordpress.com/2024/11/17/allergy-friendly-vietnamese-dining-safe-options-for-nut-soy-and-seafood-allergies/
Vietnamese Peanut-Free Dipping Sauce - Allergy Associates of La Crosse, truy cập vào tháng 11 19, 2025, https://lacrosseallergy.com/recipes/vietnamese-peanut-free-dipping-sauce/
Nut-Free Vietnamese Dip Recipe for Spring Rolls, truy cập vào tháng 11 19, 2025, https://nutfreewok.com/asian-peanut-free-dipping-sauce/
Vietnamese Chile Lemongrass Sate Sauce (Tương Ớt Sa Tế) - Bun Bo Bae, truy cập vào tháng 11 19, 2025, https://bunbobae.com/vietnamese-chile-lemongrass-sate-sauce-tuong-ot-sa-te/
Celiac Disease Foods and Additives that Contain Gluten - Stanford Children's Health, truy cập vào tháng 11 19, 2025, https://www.stanfordchildrens.org/en/services/celiac-disease/gluten-containing-foods.html
10 Hidden Sources of Gluten - Amy the Family Chef, truy cập vào tháng 11 19, 2025, https://amythefamilychef.com/blog/2018/05/12/10-hidden-sources-of-gluten/
Enhancing Soups and Sauces in Food Manufacturing: Common Thickeners, Emulsifiers, Gums, and Hydrocolloids - Processor's Choice, truy cập vào tháng 11 19, 2025, https://processorschoice.com/2024/07/25/enhancing-soups-and-sauces-in-food-manufacturing-common-thickeners-emulsifiers-gums-and-hydrocolloids/
Understanding the Different Types of Food Thickeners and How to Use Them - Kemfood, truy cập vào tháng 11 19, 2025, https://www.kemfood.com/understanding-the-different-types-of-food-thickeners-and-how-to-use-them/
Traveling with food allergies : r/VietNam - Reddit, truy cập vào tháng 11 19, 2025, https://www.reddit.com/r/VietNam/comments/1o9zfv2/traveling_with_food_allergies/
Practical Menu Engineering Tips to Drive Restaurant Profits - DoorDash Merchant, truy cập vào tháng 11 19, 2025, https://merchants.doordash.com/en-us/blog/menu-engineering-tips
The Ultimate Guide to Menu Engineering: A Chef's Playbook for Profitability - meez, truy cập vào tháng 11 19, 2025, https://www.getmeez.com/blog/the-ultimate-guide-to-menu-engineering
8 Restaurant Menu Pricing Strategies - NetSuite, truy cập vào tháng 11 19, 2025, https://www.netsuite.com/portal/resource/articles/accounting/restaurant-menu-pricing.shtml
Menu Engineering: Designing a Profitable Menu That Sells - Gilkey Restaurant Consulting, truy cập vào tháng 11 19, 2025, https://www.gilkeyrestaurantconsulting.com/news/menu-engineering-designing-a-profitable-menu-that-sells
How Does the Food Delivery Apps Algorithm Work? - Deliverect, truy cập vào tháng 11 19, 2025, https://www.deliverect.com/en-us/blog/online-food-delivery/how-does-food-delivery-apps-algorithm-work
How Does the Food Delivery Apps Algorithm Work? 10 Secrets - Enatega, truy cập vào tháng 11 19, 2025, https://enatega.com/how-does-the-food-delivery-apps-algorithm-work/
NestJS Best Practices for Developers - DEV Community, truy cập vào tháng 11 19, 2025, https://dev.to/raviyasas/nestjs-best-practices-for-developers-1670
Nest.Js best practice - DEV Community, truy cập vào tháng 11 19, 2025, https://dev.to/bsachref/nestjs-best-practice-85
