# **TÀI LIỆU ĐẶC TẢ YÊU CẦU SẢN PHẨM (PRD)**

# **HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ**

# 		**CHƯƠNG 1: GIỚI THIỆU**

## **1.1 Mục đích tài liệu**

## **1.2 Bài toán cần giải quyết** 

## **1.3 Mục tiêu sản phẩm**

## **1.4 Phạm vi (trong / ngoài phạm vi)** 

# 	**CHƯƠNG 2\. TỔNG QUAN HỆ THỐNG** 

## **2.1 Kiến trúc tổng quan (Web Client, Admin Dashboard)** 

## **2.2 Kiến trúc Backend Services** 

Backend được tách thành 3 service chạy độc lập, giao tiếp với nhau qua HTTP (REST/JSON):  
\- api-gateway: điểm vào duy nhất cho Web Client và Admin Dashboard; chuyển yêu cầu đến service tương ứng.  
\- auth-service: xử lý đăng nhập (UC07), tạo và xác thực JWT; quản lý bảng admins.  
\- content-service: quản lý địa danh, điểm tham quan, nội dung thuyết minh và file audio (UC01, UC03, UC05, UC06, UC08, UC09, UC10); quản lý các bảng locations, pois, poi\_translations.

Luồng giao tiếp:  
\- Web → api-gateway → auth-service (đăng nhập).  
\- Web → api-gateway → content-service (xem nội dung, quản trị nội dung).  
\- content-service tự kiểm tra JWT bằng JWT secret dùng chung với auth-service, không gọi sang auth-service ở mỗi yêu cầu.

Mỗi service là một ứng dụng Express riêng, có Dockerfile riêng, chạy bằng Docker Compose.

Lộ trình triển khai:  
\- Giai đoạn 1: một ứng dụng Express duy nhất, chia thành 3 module độc lập (auth, content, gateway), các module không phụ thuộc code của nhau.  
\- Giai đoạn 2: tách mỗi module thành một service chạy riêng, giao tiếp qua HTTP, có Dockerfile riêng và pipeline CI/CD.  
Đường dẫn API đặt theo tiền tố của từng service (/api/auth/..., /api/content/...) để việc tách không ảnh hưởng đến frontend.

## **2.3 Danh sách Actor** 

## **2.4 Sơ đồ Use Case tổng quan**

		*Hình 2.1: Sơ đồ Use Case tổng quan hệ thống Smart Tour Guide*   
Sơ đồ mô tả 3 tác nhân tương tác với hệ thống:  
\- Du khách: quét mã QR tại cổng, cấp quyền GPS, đổi ngôn ngữ, nghe thuyết minh tự động tại từng điểm tham quan (kích hoạt trong bán kính 10m) và xem bản đồ.  
\- Admin: đăng nhập, quản lý điểm tham quan (tọa độ GPS) và quản lý nội dung thuyết minh đa ngôn ngữ (văn bản, âm thanh).  
\- Geolocation API: hệ thống bên ngoài cung cấp tọa độ GPS của thiết bị cho UC02 và UC04.  
Chi tiết từng Use Case được trình bày ở Chương 3\.

## **2.5 Công nghệ sử dụng**

Frontend (thư mục vite-project/)  
\- Ngôn ngữ/framework: React 19 \+ TypeScript  
\- Build tool: Vite 8  
\- Giao diện: Ant Design (antd) \+ @ant-design/icons  
\- Điều hướng: React Router  
\- Quản lý state: Zustand  
\- Gọi API: Axios

Backend (thư mục backend/)  
\- Nền tảng: Node.js \+ TypeScript  
\- Framework: Express 5  
\- Kết nối CSDL: mysql2  
\- Xác thực: JWT \+ bcryptjs  
\- Khác: cors, dotenv  
\- Chạy môi trường dev: tsx

Cơ sở dữ liệu và hạ tầng  
\- CSDL: MySQL 8.0, database narration\_db  
\- Triển khai cục bộ: Docker Compose

Bản đồ: Leaflet \+ react-leaflet (dữ liệu nền OpenStreetMap)  
Upload file: multer

Quy ước: AI chỉ được dùng đúng các công nghệ trên, không tự thêm thư viện thay thế.

## **2.6 Luồng người dùng tổng quan** 

**Luồng của Du khách**  
Bước 1: Quét mã QR tại cổng (UC01)  
Bước 2: Xem trang chào, chọn ngôn ngữ (UC03)  
Bước 3: Bấm "Bắt đầu tham quan", cho phép định vị (UC02)  
Bước 4: Đi bộ trong địa danh, xem bản đồ (UC06)  
Bước 5: Đến gần một điểm (≤ 10m), thuyết minh tự phát (UC04, UC05)  
Bước 6: Nếu GPS không kích hoạt được, chọn điểm để nghe thủ công (UC10)  
Bước 7: Lặp lại bước 4 đến 6 cho các điểm tiếp theo

**Luồng của Admin**  
Bước 1: Đăng nhập (UC07)  
Bước 2: Thêm hoặc sửa điểm tham quan, chấm tọa độ trên bản đồ (UC08)  
Bước 3: Nhập văn bản và tải audio cho từng ngôn ngữ (UC09)  
Bước 4: Kiểm tra bằng cách mở web Client và nghe thử

## **2.7 Quy tắc nghiệp vụ (phân quyền, trạng thái dữ liệu)** 

### **2.7.1 Phân quyền**

\- Du khách: không cần đăng nhập, chỉ xem và nghe nội dung (UC01 \- UC06, UC10).  
\- Admin: phải đăng nhập, được thêm/sửa/xóa điểm tham quan và nội dung thuyết minh (UC07 \- UC09).  
\- Mọi API quản trị yêu cầu JWT hợp lệ; thiếu hoặc hết hạn thì trả lỗi 401\.  
\- Tài khoản admin được tạo sẵn trong CSDL, hệ thống không có chức năng đăng ký.  
\- Đăng nhập sai 5 lần liên tiếp thì khóa tài khoản 5 phút.

## 

### **2.7.2 Quy tắc phát thuyết minh**

\- BR01: Điểm tham quan được kích hoạt khi khoảng cách ≤ bán kính của điểm đó (mặc định 10m, cho phép 1 \- 100m).  
\- BR02: Khoảng cách tính bằng công thức Haversine trên trình duyệt của du khách.  
\- BR03: Nếu nhiều điểm cùng thỏa điều kiện, chọn điểm gần nhất.  
\- BR04: Mỗi điểm chỉ tự phát một lần trong một phiên (lưu bằng sessionStorage); muốn nghe lại thì dùng chọn thủ công (UC10).  
\- BR05: Đang phát thuyết minh của điểm khác thì không ngắt; điểm mới vào hàng chờ. Riêng thao tác chọn thủ công thì phát ngay.  
\- BR06: Bỏ qua tọa độ có độ chính xác kém hơn 30m và hiện cảnh báo tín hiệu GPS yếu.  
\- BR07: Chỉ phát audio sau khi du khách đã bấm "Bắt đầu tham quan" (trình duyệt chặn tự phát nếu chưa có thao tác).

## 

### **2.7.3 Quy tắc nội dung và ngôn ngữ**

\- Hỗ trợ 5 ngôn ngữ: vi, en, zh, ko, ja.  
\- Ngôn ngữ mặc định theo trình duyệt; nếu không thuộc 5 ngôn ngữ trên thì dùng tiếng Việt.  
\- Tiếng Việt là ngôn ngữ dự phòng: thiếu nội dung ở ngôn ngữ đã chọn thì hiện bản tiếng Việt kèm thông báo.  
\- Audio chỉ nhận file .mp3, tối đa 10 MB.  
\- Xóa một điểm tham quan thì xóa luôn toàn bộ nội dung và audio của điểm đó.

## 

### **2.7.4 Trạng thái dữ liệu**

\- Điểm tham quan trong phiên của du khách có hai trạng thái: chưa nghe và đã nghe (lưu ở sessionStorage, mất khi đóng phiên).  
\- Trình phát có ba trạng thái: đang phát, tạm dừng, đã nghe xong.  
\- Dữ liệu điểm và nội dung trên máy chủ không có trạng thái duyệt: Admin lưu là Web Client thấy ở lần tải tiếp theo.

## 

# 		**CHƯƠNG 3\. YÊU CẦU CHỨC NĂNG** 

## **3.1 Danh sách Use Case** 

| Mã | Tên Use Case | Actor | Mô tả ngắn | Mục đặc tả |
| :---- | :---- | :---- | :---- | :---- |
| UC01 | Quét QR  | Du khách  | Quét mã QR tại cổng để mở web của địa danh  | 3.3.1  |
| UC02 | Bắt đầu tham quan (cấp quyền GPS)  | Du khách, Geolocation API  | Bấm nút bắt đầu để mở khóa âm thanh và cho phép truy cập vị trí  | 3.3.2  |
| UC03 | Đổi ngôn ngữ  | Du khách  | Chọn ngôn ngữ hiển thị văn bản và âm thanh  | 3.3.3  |
| UC04 | Kích hoạt Geofence 10m  | Du khách, Geolocation API  | Tự phát hiện khách đến gần điểm tham quan (≤ 10m) và bật thuyết minh  | 3.3.4  |
| UC05 | Nghe thuyết minh  | Du khách  | Phát audio, hiện văn bản và điều khiển trình phát  | 3.3.5  |
| UC06 | Xem bản đồ  | Du khách  | Xem vị trí của mình và các điểm tham quan trên bản đồ  | 3.3.6  |
| UC07 | Đăng nhập  | Admin | Đăng nhập vào trang quản trị bằng tài khoản và mật khẩu  | 3.3.7  |
| UC08 | Quản lý điểm tham quan (thêm/sửa/xóa, tọa độ GPS)  | Admin | Quản lý điểm tham quan, tọa độ và bán kính kích hoạt  | 3.3.8  |
| UC09 | Quản lý nội dung thuyết minh (văn bản, audio)  | Admin | Nhập văn bản và tải file mp3 theo từng ngôn ngữ  | 3.3.9  |
| UC10 | Chọn điểm để nghe thủ công  | Du khách | Chọn điểm từ danh sách hoặc bản đồ để nghe, dùng khi GPS không kích hoạt được  | 3.3.10  |

## 

## **3.2 User Stories** 

### 	**3.2.1 User Story của Du khách**

| Mã | User Story | UC | Ưu tiên |
| :---- | :---- | :---- | :---- |
| US01 | Là du khách, tôi muốn quét mã QR tại cổng để mở ngay trang tham quan mà không cần cài app hay đăng nhập  | UC01 | Cao |
| US02 | Là du khách, tôi muốn bấm một nút “Bắt đầu tham quan” và cho phép định vị để hệ thống theo dõi vị trí và phát được âm thanh  | UC02 | Cao |
| US03 | Là du khách, tôi muốn đổi sang ngôn ngữ của mình để hiểu nội dung thuyết minh  | UC03 | Cao |
| US04 | Là du khách, tôi muốn thuyết minh tự bật khi tôi đến gần một điểm để không phải thao tác khi đang đi  | UC04 | Cao |
| US05 | Là du khách, tôi muốn tạm dừng, phát tiếp hoặc nghe lại thuyết minh và đọc văn bản song song để nghe theo nhịp của mình  | UC05 | Cao |
| US06 | Là du khách, tôi muốn xem bản đồ có vị trí của tôi và các điểm tham quan để biết mình đang ở đâu và đi tiếp hướng nào  | UC06 | Trung bình |
| US07 | Là du khách, tôi muốn tự chọn một điểm để nghe khi GPS không kích hoạt được hoặc khi muốn nghe lại  | UC10 | Trung bình |

### 

### 	**3.2.2 User Story của Admin**

| Mã | User Story | UC | Ưu tiên |
| :---- | :---- | :---- | :---- |
| US08 | Là admin, tôi muốn đăng nhập an toàn để chỉ người được phép mới quản lý được nội dung  | UC07 | Cao |
| US09 | Là admin, tôi muốn thêm, sửa, xóa điểm tham quan và chấm tọa độ trên bản đồ để cấu hình các điểm trong địa danh  | UC08 | Cao |
| US10 | Là admin, tôi muốn nhập bài thuyết minh và tải file mp3 cho từng điểm theo từng ngôn ngữ để du khách nghe được bằng ngôn ngữ của họ  | UC09 | Cao |

## **3.3 Đặc tả Use Case và Activity Diagram** 

### **3.3.1 UC01 \- Quét QR**

#### 		**3.3.1.1 Sơ đồ Use Case chi tiết**

### **![][image1]**

#### 		**3.3.1.2 Bảng đặc tả**

#### 

| Mục  | Nội dung |
| :---- | :---- |
| Mã / Tên  | UC01 \- Quét QR  |
| Actor | Du khách |
| Mô tả | Du khách quét mã QR tại cổng để mở trang web của địa danh, không cần cài app hay đăng nhập  |
| Tiền điều kiện  | Điện thoại có camera và kết nối Internet; mã QR đã được dán tại cổng  |
| Hậu điều kiện | Trang chào của địa danh hiển thị, kèm danh sách điểm tham quan và nút “Bắt đầu tham quan”  |
| Luồng chính | 1\. Du khách quét mã QR bằng camera điện thoại. 2\. Điện thoại mở URL trong trình duyệt. 3\. Web đọc tham số location\_id trên URL. 4\. Web gọi API lấy thông tin địa danh và danh sách điểm tham quan. 5\. Web hiển thị trang chào: tên địa danh, chọn ngôn ngữ (UC03), nút “Bắt đầu tham quan” (UC02).  |
| input | location\_id trên URL  |
| output | Thông tin địa danh (tên, mô tả) và danh sách điểm tham quan (tên, tọa độ, bán kính)  |
| Luồng ngoại lệ | 3a. Thiếu hoặc sai location\_id: hiện trang lỗi “Mã QR không hợp lệ”. 4a. Mất mạng hoặc API lỗi: hiện thông báo “Không tải được dữ liệu” kèm nút “Thử lại”. 4b. Địa danh không có điểm tham quan nào: hiện thông báo “Địa danh chưa có nội dung”.  |

#### 		**3.3.1.3 Activity Diagram![][image2]**

	**3.3.2 UC02 \- Ấn nút bắt đầu tham quan**

#### 		**3.3.2.1 Sơ đồ Use Case chi tiết**

#### 		**3.3.2.2 Bảng đặc tả**

| Mục  | Nội dung |
| :---- | :---- |
| Mã / Tên  | UC02 \- Bắt đầu tham quan (cấp quyền GPS)  |
| Actor | Du khách, Geolocation API  |
| Mô tả | Du khách bấm nút “Bắt đầu tham quan” để mở khóa âm thanh và cho phép web truy cập vị trí thiết bị  |
| Tiền điều kiện | Trang chào đã hiển thị (UC01); trình duyệt hỗ trợ Geolocation  |
| Hậu điều kiện | Âm thanh được phép phát; hệ thống theo dõi vị trí liên tục; chuyển sang màn hình tham quan (bản đồ và danh sách điểm)  |
| Luồng chính | 1\. Du khách bấm nút “Bắt đầu tham quan”. 2\. Web phát một âm thanh im lặng để mở khóa tự phát audio. 3\. Web gọi watchPosition của Geolocation API. 4\. Trình duyệt hiện hộp thoại xin quyền vị trí. 5\. Du khách chọn “Cho phép”. 6\. Geolocation API trả về tọa độ liên tục. 7\. Web chuyển sang màn hình tham quan và bắt đầu kiểm tra khoảng cách (UC04).  |
| input | Thao tác bấm nút; quyền vị trí của trình duyệt  |
| output | Tọa độ (lat, lng, độ chính xác) cập nhật liên tục; trạng thái “đang tham quan”  |
| Luồng ngoại lệ | 4a. Trình duyệt không hỗ trợ Geolocation: báo “Thiết bị không hỗ trợ định vị”, vẫn vào màn hình tham quan ở chế độ chọn điểm thủ công (UC10). 5a. Du khách từ chối quyền: báo cách bật lại trong cài đặt trình duyệt, vẫn vào chế độ thủ công (UC10). 6a. Quá thời gian không lấy được vị trí: hiện “Đang tìm vị trí...” và tự thử lại; sau nhiều lần vẫn lỗi thì chuyển sang chế độ thủ công. 6b. Độ chính xác kém (trên 30m): hiện cảnh báo “Tín hiệu GPS yếu”.  |

#### 		**3.3.2.3 Activity Diagram![][image3]**

### **3.3.3 UC03 \- Đổi ngôn ngữ** 

#### 		**3.3.3.1 Sơ đồ Use Case chi tiết**

#### 		**3.3.3.2 Bảng đặc tả**

| Mục | Nội dung |
| :---- | :---- |
| Mã / Tên | UC03 \- Đổi ngôn ngữ  |
| Actor | Du khách  |
| Mô tả | Du khách chọn ngôn ngữ (Việt, Anh, Trung, Hàn, Nhật) để xem văn bản và nghe audio thuyết minh bằng ngôn ngữ đó  |
| Tiền điều kiện | Trang web đã tải xong dữ liệu địa danh (UC01)  |
| Hậu điều kiện | Giao diện, văn bản và audio chuyển sang ngôn ngữ đã chọn; lựa chọn được lưu cho lần xem sau  |
| Luồng chính | 1\. Du khách bấm nút chọn ngôn ngữ (trang chào hoặc màn hình tham quan). 2\. Web hiện danh sách 5 ngôn ngữ. 3\. Du khách chọn một ngôn ngữ. 4\. Web lưu lựa chọn vào bộ nhớ trình duyệt. 5\. Web tải lại văn bản và đường dẫn audio của các điểm theo ngôn ngữ mới. 6\. Web cập nhật giao diện sang ngôn ngữ mới.  |
| Input | Mã ngôn ngữ được chọn (vi, en, zh, ko, ja)  |
| Output | Văn bản và audio thuyết minh theo ngôn ngữ đã chọn  |
| Luồng ngoại lệ | 1a. Lần đầu vào web: tự chọn ngôn ngữ theo ngôn ngữ trình duyệt; nếu không thuộc 5 ngôn ngữ trên thì mặc định tiếng Việt. 3a. Đang phát audio khi đổi ngôn ngữ: dừng audio hiện tại, không tự phát lại bằng ngôn ngữ cũ. 5a. Điểm tham quan chưa có nội dung ở ngôn ngữ đã chọn: hiện nội dung tiếng Việt và báo “Chưa có bản dịch cho ngôn ngữ này”. 5b. Mất mạng khi tải: giữ nguyên ngôn ngữ cũ, báo lỗi và cho thử lại.  |

#### 	**3.3.3.3 Activity Diagram![][image4]**

### **3.3.4 UC04 \- Kích hoạt Geofence 10m** 

#### 		**3.3.4.1 Sơ đồ Use Case chi tiết** 

#### 		**3.3.4.2 Bảng đặc tả**

| Mục | Nội dung |
| :---- | :---- |
| Mã / Tên  | UC04 \- Kích hoạt Geofence 10m  |
| Actor | Du khách, Geolocation API  |
| Mô tả | Hệ thống tự phát hiện du khách đến gần một điểm tham quan (khoảng cách ≤ bán kính kích hoạt, mặc định 10m) và tự bật thuyết minh của điểm đó  |
| Tiền điều kiện | Du khách đã bấm “Bắt đầu tham quan” và cấp quyền vị trí (UC02); danh sách điểm tham quan đã tải xong  |
| Hậu điều kiện | Thuyết minh của điểm gần nhất được tự phát (UC05); điểm đó được đánh dấu “đã phát” trong phiên  |
| Luồng chính | 1\. Geolocation API trả về tọa độ mới của du khách. 2\. Web tính khoảng cách đến từng điểm tham quan bằng công thức Haversine. 3\. Web lọc các điểm có khoảng cách ≤ bán kính kích hoạt. 4\. Nếu có nhiều điểm thỏa, chọn điểm gần nhất. 5\. Web kiểm tra điểm đó đã phát trong phiên này chưa (sessionStorage). 6\. Nếu chưa phát, web gọi UC05 để phát thuyết minh và lưu điểm vào sessionStorage. 7\. Quay lại bước 1 khi có tọa độ mới.  |
| Input | Tọa độ du khách (lat, lng, độ chính xác); danh sách điểm (lat, lng, bán kính)  |
| Output | Điểm tham quan được kích hoạt (hoặc không có điểm nào)  |
| Luồng ngoại lệ | 3a. Không có điểm nào trong vùng: không làm gì, chờ tọa độ mới. 5a. Điểm đã phát trong phiên: không phát lại, tránh làm phiền du khách. 5b. Đang phát thuyết minh của điểm khác: không ngắt giữa chừng, đưa điểm mới vào hàng chờ và phát sau khi bài hiện tại kết thúc. 1a. Độ chính xác GPS kém (trên 30m): bỏ qua tọa độ đó, hiện cảnh báo “Tín hiệu GPS yếu” và gợi ý dùng chọn thủ công (UC10). 1b. Mất quyền vị trí giữa chừng: dừng theo dõi, báo cách bật lại, chuyển sang chế độ thủ công (UC10).  |

#### 	**3.3.4.3 Activity Diagram![][image5]**

### **3.3.5 UC05 \- Nghe thuyết minh** 

#### 		**3.3.5.1 Sơ đồ Use Case chi tiết**

#### 		**3.3.5.2 Bảng đặc tả**

| Mục | Nội dung |
| :---- | :---- |
| Mã / Tên | UC05 \- Nghe thuyết minh  |
| Actor | Du khách  |
| Mô tả | Hệ thống phát audio và hiển thị văn bản thuyết minh của một điểm tham quan theo ngôn ngữ đã chọn; du khách điều khiển được việc phát  |
| Tiền điều kiện | Du khách đã bấm “Bắt đầu tham quan” (UC02); có điểm cần phát, do UC04 kích hoạt tự động hoặc do UC10 chọn thủ công  |
| Hậu điều kiện | Audio phát xong hoặc được dừng; văn bản thuyết minh hiển thị trên màn hình  |
| Luồng chính | 1\. Web nhận điểm cần phát (từ UC04 hoặc UC10). 2\. Web lấy audio và văn bản của điểm theo ngôn ngữ đã chọn (UC03). 3\. Web hiển thị tên điểm, văn bản thuyết minh và trình phát. 4\. Web tự phát audio. 5\. Du khách có thể bấm tạm dừng, phát tiếp hoặc nghe lại. 6\. Audio phát xong, trình phát chuyển sang trạng thái “Đã nghe xong”. 7\. Nếu có điểm trong hàng chờ, web phát điểm tiếp theo.  |
| Input | Mã điểm tham quan (poi\_id); ngôn ngữ đã chọn; thao tác điều khiển (tạm dừng, phát tiếp, nghe lại)  |
| Output | Âm thanh thuyết minh; văn bản thuyết minh; trạng thái trình phát (đang phát, tạm dừng, đã xong)  |
| Luồng ngoại lệ | 2a. Điểm chưa có audio ở ngôn ngữ đã chọn: chỉ hiện văn bản và báo “Chưa có âm thanh cho ngôn ngữ này”. 2b. Điểm chưa có nội dung ở ngôn ngữ đã chọn: hiện nội dung tiếng Việt và báo “Chưa có bản dịch cho ngôn ngữ này”. 4a. Trình duyệt chặn tự phát audio: hiện nút “Bấm để nghe” và chờ du khách bấm. 4b. Tải file audio lỗi hoặc mất mạng: hiện văn bản, báo “Không phát được âm thanh” kèm nút “Thử lại”. 5a. Du khách đổi ngôn ngữ khi đang phát (UC03): dừng audio hiện tại, tải lại nội dung điểm này bằng ngôn ngữ mới.  |

#### 	**3.3.5.3 Activity Diagram![][image6]**

### **3.3.6 UC06 \- Xem bản đồ** 

#### 		**3.3.6.1 Sơ đồ Use Case chi tiết** 

#### 		**3.3.6.2 Bảng đặc tả**

| Mục | Nội dung |
| :---- | :---- |
| Tên / Mã | UC06 \- Xem bản đồ  |
| Actor | Du khách |
| Mô tả | Du khách xem bản đồ số hiển thị vị trí hiện tại của mình và các điểm tham quan trong địa danh  |
| Tiền điều kiện | Du khách đã bấm “Bắt đầu tham quan” (UC02); danh sách điểm tham quan đã tải xong  |
| Hậu điều kiện | Bản đồ hiển thị đúng vị trí du khách và các điểm tham quan; vị trí cập nhật theo thời gian thực  |
| Luồng chính | 1\. Du khách mở màn hình tham quan. 2\. Web tải bản đồ và căn khung nhìn quanh địa danh. 3\. Web đặt marker cho từng điểm tham quan. 4\. Web đặt marker vị trí hiện tại của du khách. 5\. Khi có tọa độ mới, web di chuyển marker của du khách. 6\. Du khách bấm vào một marker điểm tham quan. 7\. Web hiện tên điểm, khoảng cách còn lại và nút “Nghe thuyết minh” (UC10).  |
| Input | Tọa độ du khách; danh sách điểm (tên, lat, lng); thao tác chạm vào marker  |
| Output | Bản đồ có marker du khách và marker các điểm; thông tin điểm khi chọn  |
| Luồng ngoại lệ | 2a. Không tải được bản đồ (mất mạng): hiện danh sách điểm dạng văn bản thay cho bản đồ, vẫn cho nghe thủ công (UC10). 4a. Chưa có vị trí du khách (từ chối quyền hoặc GPS chưa sẵn sàng): chỉ hiện marker các điểm, báo “Chưa xác định được vị trí của bạn”. 5a. Du khách ra xa địa danh (hơn 1 km): hiện thông báo “Bạn đang ở ngoài khu tham quan”. 6a. Điểm đã nghe trong phiên: marker đổi sang màu khác để du khách biết điểm nào đã nghe.  |

#### 	**3.3.6.3 Activity Diagram![][image7]**

### **3.3.7 UC07 \- Đăng nhập** 

#### 		**3.3.7.1 Sơ đồ Use Case tổng quát**

#### 		**3.3.7.2 Bảng đặc tả**

| Mục | Nội dung |
| :---- | :---- |
| Mã / Tên  | UC07 \- Đăng nhập  |
| Actor | Admin  |
| Mô tả | Admin đăng nhập vào trang quản trị bằng tên đăng nhập và mật khẩu để quản lý điểm tham quan và nội dung thuyết minh  |
| Tiền điều kiện | Tài khoản admin đã được tạo sẵn trong CSDL (hệ thống không có chức năng đăng ký)  |
| Hậu điều kiện | Admin nhận JWT token, được chuyển vào trang quản trị; các trang quản trị yêu cầu token hợp lệ  |
| Luồng chính | 1\. Admin mở trang đăng nhập của Admin Dashboard. 2\. Admin nhập tên đăng nhập và mật khẩu rồi bấm “Đăng nhập”. 3\. Web kiểm tra hai ô đã được nhập đủ. 4\. Web gửi yêu cầu đăng nhập lên backend. 5\. Backend tìm tài khoản và so khớp mật khẩu với bản mã hóa (bcrypt). 6\. Backend tạo JWT token có thời hạn và trả về. 7\. Web lưu token và chuyển vào trang quản lý điểm tham quan.  |
| Input | username, password  |
| Output | JWT token (kèm thời hạn) và thông tin tài khoản cơ bản (không có mật khẩu)  |
| Luồng ngoại lệ | 3a. Để trống một trong hai ô: báo “Vui lòng nhập đầy đủ”, không gửi yêu cầu. 5a. Sai tên đăng nhập hoặc mật khẩu: backend trả lỗi 401, web báo chung “Sai tên đăng nhập hoặc mật khẩu” (không nói rõ sai ô nào). 5b. Nhập sai nhiều lần liên tiếp (5 lần): tạm khóa đăng nhập vài phút và báo thời gian chờ. 4a. Mất mạng hoặc backend lỗi: báo “Không kết nối được máy chủ”, cho thử lại. 7a. Token hết hạn khi đang dùng: backend trả lỗi 401, web xóa token và đưa về trang đăng nhập kèm thông báo “Phiên đăng nhập đã hết hạn”. 7b. Truy cập trang quản trị khi chưa đăng nhập: tự chuyển về trang đăng nhập.  |

#### 	**3.3.7.3 Activity Diagram![][image8]**

### **3.3.8 UC08 \- Quản lý điểm tham quan**

#### 		**3.3.8.1 Sơ đồ Use Case chi tiết** 

#### 		**3.3.8.2 Bảng đặc tả**

| Mục | Nội dung |
| :---- | :---- |
| Mã / Tên  | UC08 \- Quản lý điểm tham quan  |
| Actor | Admin  |
| Mô tả | Admin xem danh sách, thêm, sửa, xóa các điểm tham quan của địa danh; chấm tọa độ GPS trực tiếp trên bản đồ và cấu hình bán kính kích hoạt (mặc định 10m)  |
| Tiền điều kiện | Admin đã đăng nhập (UC07) và có token hợp lệ  |
| Hậu điều kiện | Dữ liệu điểm tham quan trong CSDL được cập nhật; Web Client thấy thay đổi ở lần tải tiếp theo  |
| Luồng chính | 1\. Admin mở trang “Quản lý điểm tham quan”. 2\. Web gọi backend lấy danh sách điểm và hiển thị dạng bảng (tên, tọa độ, bán kính, thứ tự). 3\. Thêm: Admin bấm “Thêm điểm”, nhập tên, bán kính, thứ tự, rồi bấm lên bản đồ để chọn tọa độ (hoặc nhập tay lat/lng). 4\. Sửa: Admin bấm “Sửa” ở một dòng, chỉnh thông tin hoặc kéo marker trên bản đồ để đổi tọa độ. 5\. Xóa: Admin bấm “Xóa” ở một dòng và xác nhận trong hộp thoại. 6\. Web kiểm tra dữ liệu hợp lệ rồi gửi yêu cầu lên backend (kèm token). 7\. Backend lưu thay đổi và trả kết quả; web tải lại danh sách và báo thành công.  |
| Input | `name`, `latitude` (-90 đến 90), `longitude` (-180 đến 180), `radius_m` (mặc định 10), `order_index`, `location_id`  |
| Output | Danh sách điểm tham quan sau khi cập nhật; thông báo thành công hoặc lỗi  |
| Luồng ngoại lệ | 6a. Thiếu tên hoặc chưa chọn tọa độ: báo lỗi ngay tại ô tương ứng, không gửi yêu cầu. 6b. Tọa độ ngoài phạm vi hợp lệ: báo “Tọa độ không hợp lệ”. 6c. Bán kính không phải số dương hoặc quá lớn (trên 100m): báo “Bán kính phải từ 1 đến 100m”. 6d. Trùng tên điểm trong cùng địa danh: báo “Tên điểm đã tồn tại”. 5a. Xóa điểm đang có nội dung thuyết minh: cảnh báo “Sẽ xóa cả nội dung và audio của điểm này”, chỉ xóa khi Admin xác nhận. 7a. Token hết hạn (401): đưa về trang đăng nhập (UC07). 7b. Mất mạng hoặc backend lỗi: giữ nguyên dữ liệu đang nhập, báo lỗi và cho thử lại.  |

#### 	**3.3.8.3 Activity Diagram![][image9]**

### **3.3.9 UC09 \- Quản lý nội dung thuyết minh**

		3.3.9.1 Sơ đồ Use Case chi tiết  
		3.3.9.2 Bảng đặc tả

| Mục | Nội dung |
| :---- | :---- |
| Mã / Tên | UC09 \- Quản lý nội dung thuyết minh  |
| Actor | Admin  |
| Mô tả | Admin nhập bài thuyết minh và tải file audio mp3 cho từng điểm tham quan theo từng ngôn ngữ (Việt, Anh, Trung, Hàn, Nhật)  |
| Tiền điều kiện | Admin đã đăng nhập (UC07); điểm tham quan đã được tạo (UC08)  |
| Hậu điều kiện | Nội dung (văn bản, đường dẫn audio) của điểm theo ngôn ngữ đã chọn được lưu; Web Client nghe và đọc được nội dung này (UC05)  |
| Luồng chính | 1\. Admin chọn một điểm tham quan trong danh sách. 2\. Web hiển thị 5 tab ngôn ngữ, mỗi tab có ô văn bản thuyết minh và ô tải file mp3. 3\. Admin chọn một tab ngôn ngữ. 4\. Admin nhập bài thuyết minh và chọn file mp3 từ máy. 5\. Web kiểm tra loại file và dung lượng. 6\. Admin bấm “Lưu”; web gửi văn bản và file lên backend (kèm token). 7\. Backend lưu file vào thư mục lưu trữ, ghi văn bản và đường dẫn audio vào CSDL. 8\. Web báo thành công và cho nghe thử audio vừa tải lên.  |
| Input | `oi_id`, `lang` (`vi`, `en`, `zh`, `ko`, `ja`), `text`, file `audio` (.mp3)  |
| Output | Bản ghi nội dung của điểm theo ngôn ngữ (văn bản, đường dẫn audio); thông báo thành công hoặc lỗi  |
| Luồng ngoại lệ | 5a. File không phải mp3: báo “Chỉ chấp nhận file .mp3”, không gửi lên. 5b. File quá dung lượng (trên 10 MB): báo “File quá lớn, tối đa 10 MB”. 6a. Văn bản để trống: báo “Vui lòng nhập nội dung thuyết minh”; cho phép lưu văn bản mà chưa có audio. 6b. Ngôn ngữ này của điểm đã có nội dung: hỏi xác nhận “Ghi đè nội dung hiện có?” trước khi lưu. 7a. Tải file lỗi giữa chừng hoặc mất mạng: không lưu gì, giữ nguyên nội dung cũ, báo lỗi và cho thử lại. 7b. Token hết hạn (401): đưa về trang đăng nhập (UC07). 1a. Điểm chưa có nội dung tiếng Việt: hiện nhắc nhở, vì tiếng Việt là ngôn ngữ dự phòng khi thiếu bản dịch (UC03, UC05).  |

### 	**3.3.9.3 Activity Diagram![][image10]**

### **3.3.10 UC10 \- Chọn điểm để nghe thủ công**

#### 		**3.3.10.1 Sơ đồ Use Case chi tiết**

#### 		**3.3.10.2 Bảng đặc** 

| Mục | Nội dung |
| :---- | :---- |
| Mã / Tên | UC10 \- Chọn điểm để nghe thủ công  |
| Actor | Du khách  |
| Mô tả | Du khách chọn một điểm tham quan từ danh sách hoặc từ bản đồ để nghe thuyết minh ngay, dùng khi GPS không kích hoạt được hoặc khi muốn nghe lại  |
| Tiền điều kiện | Du khách đã bấm “Bắt đầu tham quan” (UC02); danh sách điểm tham quan đã tải xong  |
| Hậu điều kiện | Thuyết minh của điểm được chọn được phát (UC05); điểm được đánh dấu “đã nghe” trong phiên  |
| Luồng chính | 1\. Du khách mở danh sách điểm tham quan hoặc xem bản đồ (UC06). 2\. Du khách chọn một điểm (bấm vào dòng trong danh sách hoặc vào marker trên bản đồ). 3\. Web hiện tên điểm, khoảng cách còn lại và nút “Nghe thuyết minh”. 4\. Du khách bấm “Nghe thuyết minh”. 5\. Web gọi UC05 để phát audio và hiện văn bản của điểm đó. 6\. Web lưu điểm vào sessionStorage để UC04 không tự phát lại điểm này.  |
| Input | `poi_id` của điểm được chọn; ngôn ngữ đã chọn (UC03)  |
| Output | Thuyết minh của điểm được phát; trạng thái “đã nghe” của điểm  |
| Luồng ngoại lệ | 5a. Đang phát thuyết minh của điểm khác: dừng bài hiện tại và phát điểm vừa chọn ngay, vì đây là thao tác chủ động của du khách. 5b. Điểm chưa có nội dung hoặc audio ở ngôn ngữ đã chọn: xử lý như UC05 (hiện văn bản hoặc nội dung tiếng Việt kèm thông báo). 3a. Du khách đang ở xa điểm được chọn: vẫn cho nghe, chỉ hiện khoảng cách để tham khảo, không chặn. 1a. Danh sách điểm trống: báo “Địa danh chưa có điểm tham quan”.  |

### 	**3.3.10.3 Activity Diagram![][image11]**

# 	**CHƯƠNG 4\. YÊU CẦU PHI CHỨC NĂNG** 

## **4.1 Hiệu năng** 

## **4.2 Bảo mật** 

## **4.3 Tương thích thiết bị và trình duyệt** 

## **4.4 Khả năng sử dụng** 

## **4.5 Yêu cầu CI/CD và triển khai** 

### **4.5.1 Quy trình CI (chạy mỗi khi đẩy code hoặc tạo Pull Request)**

Công cụ: GitHub Actions. Quy trình gồm các bước theo thứ tự:  
1\. Lấy mã nguồn và cài thư viện (npm ci).  
2\. Kiểm tra mã (lint) và kiểm tra kiểu TypeScript.  
3\. Chạy kiểm thử tự động (test) cho backend.  
4\. Build backend và frontend.  
5\. Nếu một bước lỗi thì pipeline dừng và báo đỏ; không được gộp code vào nhánh main khi pipeline chưa xanh.

### **4.5.2 Quy trình CD (chạy khi gộp code vào nhánh main)**

1\. Build Docker image cho từng service: api-gateway, auth-service, content-service (giai đoạn 1: một image backend duy nhất) và một image cho frontend.  
2\. Đẩy image lên kho chứa image (GitHub Container Registry).  
3\. Triển khai bằng Docker Compose trên máy chủ: kéo image mới và khởi động lại các service.  
4\. Sau khi khởi động, pipeline gọi GET /api/health (API09); nếu không trả 200 thì đánh dấu triển khai thất bại.

### 

### **4.5.3 Yêu cầu triển khai**

\- Mỗi service có Dockerfile riêng và cổng riêng; chạy cùng nhau bằng một file docker-compose.yml (kèm MySQL 8.0).  
\- Cấu hình nhạy cảm (mật khẩu CSDL, JWT secret) đặt trong biến môi trường và GitHub Secrets, không đưa vào mã nguồn.  
\- Các service dùng chung một JWT secret để content-service tự kiểm tra token.  
\- Thư mục lưu file audio (/uploads/audio) được gắn volume để không mất file khi khởi động lại container.  
\- Quy tắc nhánh: nhánh main luôn chạy được; làm tính năng trên nhánh riêng rồi gộp qua Pull Request.

# 		**CHƯƠNG 5\. THIẾT KẾ DỮ LIỆU** 

## **5.1 ERD / Class Diagram** 

## **5.2 Mô tả các bảng** 

Cơ sở dữ liệu MySQL 8.0, tên database: narration\_db. Gồm 4 bảng: locations, pois, poi\_translations, admins. Quan hệ: 1 location có nhiều poi (1-n); 1 poi có nhiều poi\_translations, mỗi ngôn ngữ một dòng (1-n).

### **5.2.1 Bảng locations (địa danh)** 

| Cột  | Kiểu dữ liệu  | Ràng buộc | Ghi chú |
| :---- | :---- | :---- | :---- |
| id | INT  | PK, AUTO\_INCREMENT  | Dùng làm `location_id` trên URL của mã QR  |
| name | VARCHAR(255)  | NOT NULL  | Tên địa danh, ví dụ Dinh Độc Lập  |
| description | TEXT | NULL  | Mô tả ngắn hiển thị ở trang chào  |
| created\_at | TIMESTAMP  | DEFAULT CURRENT\_TIMESTAMP  |  |

### **5.2.2 Bảng pois (điểm tham quan)** 

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| :---- | :---- | :---- | :---- |
| id | INT | PK, AUTO\_INCREMENT  | Chính là poi\_id |
| location\_id | INT | FK → locations.id, NOT NULL  | Điểm thuộc địa danh nào  |
| name | VARCHAR(255)  | NOT NULL  | Tên điểm; duy nhất trong cùng địa danh |
| latitude | DECIMAL(10,7)  | NOT NULL  | Từ \-90 đến 90  |
| longitude | DECIMAL(10,7)  | NOT NULL  | Từ \-180 đến 180  |
| radius\_m  | INT | NOT NULL, DEFAULT 0  | Bán kính kích hoạt từ 1 đến 100 |
| order\_index  | INT | NOT NULL, DEFAULT 0  | Thứ tự hiển thị trong danh sách |
| created\_at  | TIMESTAMP  | DEFAULT CURRENT\_TIMESTAMP  |  |
| update\_at | TIMESTAMP  | ON UPDATE CURRENT\_TIMESTAMP  |  |

Ràng buộc duy nhất: (location\_id, name). Xóa một location hoặc poi thì xóa theo các bản ghi con (ON DELETE CASCADE). 

### **5.2.3 Bảng poi\_translations (nội dung thuyết minh theo ngôn ngữ)** 

| Cột | Kiểu dữ liêu | Ràng buộc | Ghi chú |
| :---- | :---- | :---- | :---- |
| id | INT | PK, AUTO\_INCREMENT  |  |
| poi\_id | INT | FK → pois.id, NOT NULL  | Nội dung này thuộc điểm nào |
| lang | VARCHAR(5)  | NOT NULL  | Mã ngôn ngữ: `vi`, `en`, `zh`, `ko`, `ja`  |
| narration\_text  | TEXT | NOT NULL  | Bài thuyết minh bằng ngôn ngữ tương ứng  |
| audio\_url  | VARCHAR(500) | NULL  | Đường dẫn file mp3; để trống nếu chưa có audio  |
| created\_at  | TIMESTAMP  | DEFAULT CURRENT\_TIMESTAMP  |  |
| updated\_at  | TIMESTAMP  | ON UPDATE CURRENT\_TIMESTAMP  |  |

Ràng buộc duy nhất: (poi\_id, lang), mỗi điểm chỉ có một bản nội dung cho mỗi ngôn ngữ.  
Xóa poi thì xóa theo các dòng nội dung của poi đó (ON DELETE CASCADE), file mp3 tương ứng cũng bị xóa khỏi thư mục lưu trữ.

### **5.2.4 Bảng admins (tài khoản quản trị)** 

| Cột  | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| :---- | :---- | :---- | :---- |
| id  | INT | PK, AUTO\_INCREMENT  |  |
| username | VARCHAR(100)  | NOT NULL, UNIQUE  | Tên đăng nhập |
| password\_hash | VARCHAR(255)  | NOT NULL | Mật khẩu đã mã hóa bằng bcrypt, không lưu mật khẩu gốc  |
| created\_at | TIMESTAMP  | DEFAULT CURRENT\_TIMESTAMP  |  |
| failed\_attempts  | INT  | NOT NULL, DEFAULT 0  | Số lần đăng nhập sai liên tiếp; về 0 khi đăng nhập đúng  |
| locked\_until  | TIMESTAMP  | NULL  | Thời điểm hết khóa; trống nếu không bị khóa  |

### 

## **5.3 Component Diagram** 

## **5.4 Deployment Diagram** 

# **Chương 6 (API)**

## **6.1 Danh sách endpoint** 

Quy ước: cột CSDL dùng snake\_case (radius\_m); tên trường trong JSON của API dùng camelCase (radiusM). Backend chịu trách nhiệm chuyển đổi giữa hai dạng.  
Mọi API có tiền tố /api. Phần tiếp theo là tên service (auth hoặc content) để việc tách service sau này không ảnh hưởng frontend.  
Quyền "Công khai" nghĩa là không cần đăng nhập. Quyền "Admin" yêu cầu header Authorization: Bearer \<JWT\>; thiếu hoặc hết hạn thì trả 401\.

| Mã | Method | URL | Quyền | UC | Mô tả |
| :---- | :---- | :---- | :---- | :---- | :---- |
| API01  | POST | /api/auth/login  | Công khai | UC07  | Đăng nhập, trả JWT  |
| API02 | GET | /api/content/locations/:id  | Công khai | UC01, UC06, UC10  | Lấy thông tin địa danh kèm danh sách điểm tham quan (tên, tọa độ, bán kính, thứ tự)  |
| API03 | GET | /api/content/pois/:id?lang=vi  | Công khai | UC03, UC05, UC10  | Lấy văn bản và audio của một điểm theo ngôn ngữ; thiếu thì trả bản tiếng Việt  |
| API04 | POST | /api/content/pois  | Admin | UC08  | Thêm điểm tham quan  |
| API05 | PUT | /api/content/pois/:id  | Admin | UC08  | Sửa điểm tham quan (thông tin, tọa độ, bán kính)  |
| API06 | DELETE | /api/content/pois/:id  | Admin | UC08  | Xóa điểm, xóa luôn nội dung và audio  |
| API07 | GET | /api/content/pois/:id/translations  | Admin | UC09  | Lấy nội dung của điểm ở tất cả ngôn ngữ  |
| API08 | PUT | /api/content/pois/:id/translations/:lang  | Admin | UC09  | Lưu văn bản và tải file mp3 cho một ngôn ngữ (dữ liệu dạng multipart); ghi đè nếu đã có  |
| API09 | GET | /api/health  | Công khai | CI/CD | Kiểm tra backend còn chạy, dùng cho pipeline và Docker  |

	File audio được phục vụ dưới dạng file tĩnh tại /uploads/audio/\<tên file\>; đường dẫn này được lưu vào cột audio\_url của bảng poi\_translations.

## **6.2 Request/Response** 

**API01 \- POST /api/auth/login**   
Request body:  
{  
  "username": "admin",  
  "password": "matkhau123"  
}

200 OK:  
{  
  "token": "\<JWT\>",  
  "expiresIn": 3600,  
  "admin": { "id": 1, "username": "admin" }  
}

400 Bad Request (thiếu ô nhập):  
{ "message": "Vui lòng nhập đầy đủ" }

401 Unauthorized (sai tên đăng nhập hoặc mật khẩu):  
{ "message": "Sai tên đăng nhập hoặc mật khẩu" }

429 Too Many Requests (sai 5 lần liên tiếp, khóa 5 phút):  
{ "message": "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau", "retryAfterSeconds": 300 }

**API02 \- GET /api/content/locations/:id**   
Ví dụ: GET /api/content/locations/1

200 OK:  
{  
  "id": 1,  
  "name": "Dinh Độc Lập",  
  "description": "Mô tả ngắn hiển thị ở trang chào",  
  "pois": \[  
    {  
      "id": 5,  
      "name": "Sảnh chính",  
      "latitude": 10.7769000,  
      "longitude": 106.6954000,  
      "radiusM": 10,  
      "orderIndex": 1  
    }  
  \]  
}

Địa danh chưa có điểm nào: vẫn trả 200 với "pois": \[\]  
(web hiển thị "Địa danh chưa có nội dung").

404 Not Found (mã địa danh không tồn tại):  
{ "message": "Mã QR không hợp lệ" }

**API03 \- GET /api/content/pois/:id?lang=en**   
Ví dụ: GET /api/content/pois/5?lang=en

200 OK (có nội dung đúng ngôn ngữ):  
{  
  "poiId": 5,  
  "name": "Sảnh chính",  
  "lang": "en",  
  "text": "Welcome to the main hall...",  
  "audioUrl": "/uploads/audio/poi5-en.mp3",  
  "fallback": false  
}

200 OK (chưa có bản dịch, trả bản tiếng Việt):  
{  
  "poiId": 5,  
  "name": "Sảnh chính",  
  "lang": "vi",  
  "text": "Chào mừng đến sảnh chính...",  
  "audioUrl": null,  
  "fallback": true  
}

400 Bad Request (lang không thuộc vi, en, zh, ko, ja):  
{ "message": "Ngôn ngữ không được hỗ trợ" }

404 Not Found (điểm không tồn tại):  
{ "message": "Không tìm thấy điểm tham quan" }

**API04 \- POST /api/content/pois**   
Header: Authorization: Bearer \<JWT\>

Request body:  
{  
  "locationId": 1,  
  "name": "Sảnh chính",  
  "latitude": 10.7769000,  
  "longitude": 106.6954000,  
  "radiusM": 10,  
  "orderIndex": 1  
}

201 Created:  
{  
  "id": 5,  
  "locationId": 1,  
  "name": "Sảnh chính",  
  "latitude": 10.7769000,  
  "longitude": 106.6954000,  
  "radiusM": 10,  
  "orderIndex": 1  
}

400 Bad Request (thiếu tên, tọa độ ngoài phạm vi, bán kính ngoài 1..100):  
{  
  "message": "Dữ liệu không hợp lệ",  
  "errors": { "radiusM": "Bán kính phải từ 1 đến 100m" }  
}

401 Unauthorized (thiếu hoặc hết hạn token):  
{ "message": "Phiên đăng nhập đã hết hạn" }

404 Not Found (locationId không tồn tại):  
{ "message": "Không tìm thấy địa danh" }

409 Conflict (trùng tên trong cùng địa danh):  
{ "message": "Tên điểm đã tồn tại" }

**API05 \- PUT /api/content/pois/:id**   
Ví dụ: PUT /api/content/pois/5  
Header: Authorization: Bearer \<JWT\>

Request body (gửi đủ các trường như API04, không cần locationId):  
{  
  "name": "Sảnh chính",  
  "latitude": 10.7770000,  
  "longitude": 106.6955000,  
  "radiusM": 15,  
  "orderIndex": 1  
}

200 OK: trả về điểm sau khi sửa, cùng dạng với kết quả của API04

400 / 401 / 409: giống API04  
404 Not Found (điểm không tồn tại):  
{ "message": "Không tìm thấy điểm tham quan" }

**API06 \- DELETE /api/content/pois/:id**   
Ví dụ: DELETE /api/content/pois/5  
Header: Authorization: Bearer \<JWT\>

200 OK:  
{ "message": "Đã xóa điểm tham quan", "deletedTranslations": 3 }

401 Unauthorized:  
{ "message": "Phiên đăng nhập đã hết hạn" }

404 Not Found:  
{ "message": "Không tìm thấy điểm tham quan" }

**API07 \- GET /api/content/pois/:id/translations**   
Ví dụ: GET /api/content/pois/5/translations  
Header: Authorization: Bearer \<JWT\>

200 OK (luôn trả đủ 5 ngôn ngữ, ngôn ngữ chưa có nội dung thì text và audioUrl là null):  
{  
  "poiId": 5,  
  "translations": \[  
    { "lang": "vi", "text": "Chào mừng đến sảnh chính...", "audioUrl": "/uploads/audio/poi5-vi.mp3" },  
    { "lang": "en", "text": "Welcome to the main hall...", "audioUrl": null },  
    { "lang": "zh", "text": null, "audioUrl": null },  
    { "lang": "ko", "text": null, "audioUrl": null },  
    { "lang": "ja", "text": null, "audioUrl": null }  
  \]  
}

401 Unauthorized:  
{ "message": "Phiên đăng nhập đã hết hạn" }

404 Not Found (điểm không tồn tại):  
{ "message": "Không tìm thấy điểm tham quan" }

**API08 \- PUT /api/content/pois/:id/translations/:lang**   
Ví dụ: PUT /api/content/pois/5/translations/en  
Header: Authorization: Bearer \<JWT\>  
Content-Type: multipart/form-data

Các trường gửi lên:  
  text   (chuỗi, bắt buộc)  
  audio  (file .mp3, tối đa 10 MB, không bắt buộc)

200 OK (lưu mới hoặc ghi đè):  
{  
  "poiId": 5,  
  "lang": "en",  
  "text": "Welcome to the main hall...",  
  "audioUrl": "/uploads/audio/poi5-en.mp3",  
  "overwritten": false  
}

400 Bad Request (text trống, lang không thuộc vi, en, zh, ko, ja):  
{ "message": "Vui lòng nhập nội dung thuyết minh" }

401 Unauthorized:  
{ "message": "Phiên đăng nhập đã hết hạn" }

404 Not Found (điểm không tồn tại):  
{ "message": "Không tìm thấy điểm tham quan" }

413 Payload Too Large (file quá 10 MB):  
{ "message": "File quá lớn, tối đa 10 MB" }

415 Unsupported Media Type (file không phải .mp3):  
{ "message": "Chỉ chấp nhận file .mp3" }

**API09 \- GET /api/health**   
200 OK:  
{ "status": "ok" }

Không cần đăng nhập. Nếu kết nối MySQL lỗi thì trả 503:  
{ "status": "error" }

# **CHƯƠNG 7\. GIAO DIỆN VÀ TRẢI NGHIỆM** 

## **7.1 Wireframe dạng text**

### **7.1.1 Web Client \- Trang chào (UC01, UC02, UC03)**

Bố cục từ trên xuống:  
1\. Tiêu đề: tên địa danh (name) và mô tả ngắn (description)  
2\. Chọn ngôn ngữ: 5 nút vi, en, zh, ko, ja; ngôn ngữ đang chọn được tô nổi  
3\. Danh sách điểm tham quan: chỉ hiển thị tên, theo thứ tự order\_index  
4\. Nút lớn "Bắt đầu tham quan" cố định ở cuối màn hình

Trạng thái đặc biệt:  
\- Đang tải: hiện vòng xoay (spinner)  
\- Mã QR sai hoặc lỗi tải: hiện thông báo lỗi và nút "Thử lại" (UC01)  
\- Chưa có điểm nào: hiện "Địa danh chưa có nội dung", ẩn nút bắt đầu

### **7.1.2 Web Client \- Màn hình tham quan (UC03, UC04, UC05, UC06, UC10)**

Bố cục từ trên xuống (khung điện thoại dọc):  
1\. Thanh trên cùng: tên địa danh và nút đổi ngôn ngữ (UC03)  
2\. Bản đồ (chiếm khoảng 50% chiều cao): marker vị trí du khách, marker các điểm tham quan; điểm đã nghe đổi màu (UC06)  
3\. Trình phát thuyết minh: tên điểm đang phát, thanh tiến độ, nút Tạm dừng/Phát tiếp, nút Nghe lại (UC05)  
4\. Văn bản thuyết minh: hiện song song với audio, cuộn được  
5\. Danh sách điểm tham quan: mỗi dòng gồm tên, khoảng cách còn lại, dấu "đã nghe"; bấm vào dòng để nghe thủ công (UC10)

Khi bấm vào marker trên bản đồ: hiện thẻ nhỏ gồm tên điểm, khoảng cách và nút "Nghe thuyết minh" (UC10).

Trạng thái đặc biệt:  
\- Chưa xác định được vị trí: ẩn marker du khách, hiện thông báo "Chưa xác định được vị trí của bạn" (UC06)  
\- Tín hiệu GPS yếu (sai số trên 30m): hiện dải cảnh báo "Tín hiệu GPS yếu", gợi ý chọn điểm thủ công (UC04)  
\- Ở xa khu tham quan (trên 1 km): hiện "Bạn đang ở ngoài khu tham quan" (UC06)  
\- Trình duyệt chặn tự phát: hiện nút "Bấm để nghe" thay cho trình phát (UC05)  
\- Không tải được bản đồ: ẩn bản đồ, chỉ còn danh sách điểm (UC06)  
\- Chưa có audio hoặc bản dịch: hiện thông báo tương ứng dưới trình phát (UC05)

### **7.1.3 Admin \- Đăng nhập (UC07)**

Bố cục: thẻ đăng nhập nằm giữa màn hình  
1\. Tiêu đề "Quản trị Smart Tour Guide"  
2\. Ô Tên đăng nhập  
3\. Ô Mật khẩu (ẩn ký tự)  
4\. Nút "Đăng nhập"

Trạng thái đặc biệt:  
\- Để trống một ô: báo "Vui lòng nhập đầy đủ" ngay tại form, không gửi yêu cầu  
\- Sai thông tin: báo chung "Sai tên đăng nhập hoặc mật khẩu"  
\- Mất mạng hoặc backend lỗi: báo "Không kết nối được máy chủ"  
\- Đang gửi yêu cầu: nút chuyển sang trạng thái đang tải, không bấm được lần nữa  
\- Bị đưa về từ trang khác vì token hết hạn: hiện "Phiên đăng nhập đã hết hạn"  
\- Đăng nhập thành công: chuyển vào trang Quản lý điểm tham quan

### **7.1.4 Admin \- Quản lý điểm tham quan (UC08)**

Bố cục: thanh menu bên trái (Điểm tham quan, Nội dung thuyết minh, Đăng xuất); phần chính bên phải  
1\. Thanh tiêu đề: "Quản lý điểm tham quan" và nút "Thêm điểm"  
2\. Bảng danh sách: cột Tên, Vĩ độ, Kinh độ, Bán kính (m), Thứ tự, và cột thao tác có nút "Sửa", "Xóa"  
3\. Biểu mẫu Thêm/Sửa (hộp thoại): ô Tên, Bán kính (mặc định 10), Thứ tự, bản đồ để bấm chọn tọa độ hoặc kéo marker, ô nhập tay vĩ độ và kinh độ; nút "Lưu" và "Hủy"  
4\. Hộp thoại xác nhận xóa: ghi rõ "Sẽ xóa cả nội dung và audio của điểm này" và hai nút "Xóa", "Hủy"

Trạng thái đặc biệt:  
\- Dữ liệu sai: báo lỗi ngay tại ô tương ứng (thiếu tên, chưa chọn tọa độ, bán kính ngoài 1 đến 100, trùng tên)  
\- Lưu thành công: đóng hộp thoại, bảng tải lại, hiện thông báo thành công  
\- Mất mạng hoặc backend lỗi: giữ nguyên dữ liệu đang nhập, báo lỗi và có nút "Thử lại"  
\- Token hết hạn: chuyển về trang đăng nhập  
\- Danh sách trống: hiện "Chưa có điểm tham quan nào" kèm nút "Thêm điểm"

### **7.1.5 Admin \- Quản lý nội dung thuyết minh (UC09)**

Bố cục: dùng chung thanh menu bên trái với 7.1.4; phần chính bên phải  
1\. Thanh chọn điểm: danh sách thả xuống chọn điểm tham quan cần chỉnh nội dung  
2\. 5 tab ngôn ngữ: vi, en, zh, ko, ja; tab đã có nội dung hiện dấu tích  
3\. Trong mỗi tab:  
   \- Ô nhập văn bản thuyết minh (nhiều dòng)  
   \- Ô chọn file .mp3 (chỉ nhận .mp3, tối đa 10 MB)  
   \- Trình nghe thử file audio hiện có  
   \- Nút "Lưu"

Trạng thái đặc biệt:  
\- Chưa chọn điểm: ẩn các tab, hiện "Hãy chọn một điểm tham quan"  
\- Điểm chưa có nội dung tiếng Việt: hiện nhắc nhở "Nên nhập bản tiếng Việt trước, vì đây là ngôn ngữ dự phòng"  
\- File không phải .mp3 hoặc quá 10 MB: báo lỗi ngay, không gửi lên  
\- Văn bản để trống: báo "Vui lòng nhập nội dung thuyết minh"  
\- Ngôn ngữ này đã có nội dung: hỏi "Ghi đè nội dung hiện có?" trước khi lưu  
\- Đang tải file lên: hiện thanh tiến độ, nút "Lưu" không bấm được  
\- Lưu thành công: báo thành công, trình nghe thử cập nhật file mới  
\- Lỗi mạng hoặc backend: giữ nguyên dữ liệu đang nhập, báo lỗi và có nút "Thử lại"  
\- Token hết hạn: chuyển về trang đăng nhập

## **7.2 Danh sách UI Components** 

| Thành phần | Component | Dùng ở màn hình |
| :---- | :---- | :---- |
| Nút bấm | Button | Tất cả (Bắt đầu tham quan, Lưu, Thêm điểm, Thử lại)  |
| Chọn ngôn ngữ | Segmented hoặc Select  | 7.1.1, 7.1.2  |
| Danh sách điểm tham quan  | List | 7.1.1, 7.1.2  |
| Nhãn “đã nghe”  | Tag | 7.1.2  |
| Dải cảnh báo (GPS yếu, ở xa khu tham quan)  | Alert | 7.1.2  |
| Trạng thái đang tải  | Spin | 7.1.1, 7.1.2, 7.1.3  |
| Trang lỗi, trang trống  | Result, Empty  | 7.1.1, 7.1.2, 7.1.4  |
| Thông báo thành công hoặc lỗi nhanh  | message  | 7.1.3, 7.1.4, 7.1.5  |
| Biểu mẫu và các ô nhập  | Form, Input, Input.Password, InputNumber  | 7.1.3, 7.1.4, 7.1.5  |
| Bảng danh sách điểm  | Table | 7.1.4  |
| Hộp thoại thêm/sửa  | Modal | 7.1.4  |
| Xác nhận xóa, ghi đè  | Modal.confirm hoặc Popconfirm  | 7.1.4, 7.1.5  |
| Khung và thanh menu bên trái  | Layout, Menu  | 7.1.4, 7.1.5  |
| 5 tab ngôn ngữ  | Tabs | 7.1.5  |
| Tải file mp3 lên  | Upload | 7.1.5  |
| Thanh tiến độ tải file  | Progress | 7.1.5  |
| Bản đồ và marker  | Leaflet (react-leaflet)  | 7.1.2, 7.1.4  |
| Trình phát audio  | Thẻ audio HTML5 kèm nút điều khiển bằng Button  | 7.1.2, 7.1.5  |

## 

## **7.3 Design System cơ bản**

Màu sắc  
\- Màu chủ đạo: \#1677ff (xanh mặc định của Ant Design)  
\- Thành công: \#52c41a; cảnh báo: \#faad14; lỗi: \#ff4d4f  
\- Marker điểm tham quan chưa nghe: xanh dương; đã nghe: xám  
\- Marker vị trí du khách: đỏ, có vòng tròn thể hiện độ chính xác GPS

Chế độ giao diện  
\- Chỉ làm chế độ sáng (light mode), không làm chế độ tối.

Chữ  
\- Dùng font hệ thống của thiết bị (đã hỗ trợ cả 5 ngôn ngữ vi, en, zh, ko, ja), không tải font ngoài.  
\- Cỡ chữ nội dung thuyết minh: tối thiểu 16px để đọc được khi đi bộ ngoài trời.

Bố cục  
\- Web Client: thiết kế cho điện thoại dọc (mobile-first), nội dung rộng tối đa 480px. Các nút chạm có chiều cao tối thiểu 44px.  
\- Admin Dashboard: thiết kế cho máy tính, chiều rộng tối thiểu 1024px, không cần tối ưu cho điện thoại.

Ngôn ngữ giao diện  
\- Chữ trên giao diện Web Client (nút, thông báo) đổi theo ngôn ngữ du khách chọn; Admin Dashboard chỉ dùng tiếng Việt.

		  
   












